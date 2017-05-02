var request = require('request');
var config = require('../config');


/**
 * Module exports.
 * @public
 */
module.exports = api;
module.exports.bind = bind;
module.exports.reqAPIJson = reqAPIJson;

function api(){
    // constructor
    
    return function(res, req, next){
        next();
    };
}

api.bind('getSummonerByName', function(name, callback)
{
    var url = 'https://kr.api.pvp.net/api/lol/kr/v1.4/summoner/by-name/' + encodeURI(name) + '?api_key=' + config.apiKey;
    
    reqAPIJson(url, function(err, result){
        if(err || ! result) {
            callback(err);
        }
        else {
            var username = name;
            // 첫 key가 소환사명임
            for(var key in result){
                username = key;
                break;
            }
            callback(null, result[username]);
        }
    });
});

api.bind('getMatchIncludeTimeline', function(matchId, callback)
{
    var url = 'https://kr.api.pvp.net/api/lol/kr/v2.2/match/' + matchId + '?includeTimeline=true&api_key=' + config.apiKey;
    
    reqAPIJson(url, function(err, result){
        if(err)
            callback(err);
        else
            callback(null, result);
    });
});

api.bind('getJsonTimelineOfMatch', function(matchId, callback)
{
    api.getMatchIncludeTimeline(matchId, function(err, result) {
        if(err){
            callback(err);
        }
        else if( typeof result != 'object' ){
            callback(err);
        }
        else {
            callback(null, result.timeline);
        }
    });
});

api.bind('getLatestGameByName', function(name, callback)
{
    api.getRecentGamesByName(name, function(err, result) {
        if(err || ! result.games)
            callback(err);
        else
            callback(null, result.games[0]);
    });
});

api.bind('getRecentGamesByName', function(name, callback)
{
    api.getSummonerByName(name, function(err, result) {
        if(err || !result)
            return callback(err);
        
        var summonerId = result.id;
        var url = 'https://kr.api.pvp.net/api/lol/kr/v1.3/game/by-summoner/' + summonerId + '/recent?api_key=' + config.apiKey;
        
        reqAPIJson(url, callback);
    });
});

api.bind('getEventTypesOfGame', function(matchId, callback)
{
    var makeList = function(jsonData){
        var eventTypes = {};
        
        function traverse(items){
            for(var item in items){
                if(typeof items[item] == "object"){
                    traverse( items[item] );
                } else if( item == 'eventType' ){
                    eventTypes[items[item]] = 1;
                }
            }
            return eventTypes;
        }
        
        return (function(json){
            var ret = [];
            for(var key in json){
                ret.push(key);
            }
            return ret;
        })(traverse(jsonData) || []).sort();
    };
    
    api.getJsonTimelineOfMatch(matchId, function(err, result){
        if(err)
            return callback(err);

        callback(null, makeList(result));
    });
});

api.bind('getTimelineOfMatch', function(matchId, callback)
{
    api.getJsonTimelineOfMatch(matchId, function(err, result){
        if(err)
            return callback(err);

        callback(null, api.timelineBeautyForChamps(result));
    });
});

api.bind('timelineBeautyForChamps', function(matchJson)
{
    if( typeof matchJson != 'object' ) return [];
    
    var frames = matchJson.frames;
    var timeline = {};
    
    for(var minute in frames){
        var frame = frames[minute].participantFrames;
        var curTimestamp = frames[minute].timestamp;
        for(var championIndex in frame){
            if(frame[championIndex].position){
                if( typeof timeline[championIndex] != 'object' ){
                    timeline[championIndex] = new Array();
                }
                frame[championIndex].timestamp = curTimestamp;
                
                timeline[championIndex].push(frame[championIndex]);
            }
        }
    }
    
    return timeline;
});

api.bind('timelineBeautyForEvents', function(matchJson)
{
    if( typeof matchJson != 'object' ) return [];
    
    var frames = matchJson.frames;
    var timeline = [];
    
    for(var minute in frames){
        var events = frames[minute].events || {};
        for(var e in events){
            timeline.push(events[e]);
        }
    }
    
    return timeline;
});

api.bind('generateChampionsSnapshots', function(matchJson)
{
    var timeline = api.timelineBeautyForChamps(matchJson) || {};
    var eventTimeline = api.timelineBeautyForEvents(matchJson) || [];
    
    if( ! timeline ) return {};
    
    var initStat = function(pid){
        return {
            "participantId": pid,
    		"champLevel": 0,
    		"item0": 0, "item1": 0, "item2": 0, "item3": 0,
    		"item4": 0, "item5": 0, "item6": 0,
    		"kills": 0,
    		"deaths": 0,
    		"assists": 0,
    		"minionsKilled": 0,
    		"jungleMinionsKilled": 0,
    		"goldEarned": 0,
    		"currentGold": 0,
    	};
    };
    
    var totalMinute = timeline[1].length;
    
    var snapshots = {};
    for(var minutes = 0; minutes < totalMinute; ++minutes) {
        snapshots[minutes] = [];
        for(var participantId=0; participantId<=10; ++participantId) {
            snapshots[minutes].push(initStat(participantId));
        }
    }
    
    // 1분 주기로 저장된 데이터를 대입
    for(var championId in timeline){
        var TL = timeline[championId];
        for(var min in TL){
            var T = TL[min];
            var snaps = snapshots[min][T.participantId];
            
        	snaps.champLevel = T.level;
            snaps.goldEarned = T.totalGold;
            snaps.currentGold = T.currentGold;
        	snaps.minionsKilled = T.minionsKilled;
        	snaps.jungleMinionsKilled = T.jungleMinionsKilled;
        }
    }
    
    for(var e in eventTimeline){
        var E = eventTimeline[e];
        var curMin = Math.floor(E.timestamp / 60000);
        var curSnap = snapshots[curMin];
        
        if(E.eventType == 'CHAMPION_KILL'){
            curSnap[E.killerId].kills  += 1;
            curSnap[E.victimId].deaths += 1;
            for(var ep in E.assistingParticipantIds){
                var assister = E.assistingParticipantIds[ep];
                curSnap[assister].assists += 1;
            }
        }
    }
    
    for(var min=1; min < totalMinute; ++min){
        for(var cid=1; cid<=10; ++cid){
            snapshots[min][cid].kills += snapshots[min-1][cid].kills;
            snapshots[min][cid].deaths += snapshots[min-1][cid].deaths;
            snapshots[min][cid].assists += snapshots[min-1][cid].assists;
        }
    }
    
    return snapshots;
});

/**
 * Test course
 */
api.bind('getTimeline2OfMatch', function(matchId, callback)
{
    api.getJsonTimelineOfMatch(matchId, function(err, result){
        if(err)
            return callback(err);

        callback(null, api.generateTimeline2OfMatch(result));
    });
});

api.bind('generateTimeline2OfMatch', function(timeline)
{
    if( ! timeline ) return {};
    
    var result = {};
    var frames = timeline.frames;
    
    var pushEvent = function(arr, sec, event){
        if( typeof arr[sec] != 'object' ){
            arr[sec] = new Array();
        }
        arr[sec].push(event);
    };
    
    var timestampToSecond = function(t){
        return Math.floor(t / 1000);
    }
    
    for(var i in frames){
        var frame = frames[i];
        
        // participant frames
        for(var j in frame.participantFrames){
            var champStat = frame.participantFrames[j];
            champStat.eventType = 'CHAMPION_STATUS';
            pushEvent(result, timestampToSecond(frame.timestamp), champStat);
        }
        
        // events
        for(var j in frame.events){
            var event = frame.events[j];
            pushEvent(result, timestampToSecond(event.timestamp), event);
        }
    }
    
    // timeline(events) order by seconds
    return result;
});

/**
 * Priavte handler
 * @private
 */
function bind(name, fn){
    api[name] = fn;
    return this;
}

function reqAPIJson(url, callback){
    
    console.log('Request to Riot games..', url);
    
    request(url, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            callback(null, JSON.parse(body));
        } else {
            callback(error);
        }
    });
}