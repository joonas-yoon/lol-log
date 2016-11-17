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
    
    for(var i in frames){
        var frame = frames[i].participantFrames;
        var curTimestamp = frames[i].timestamp;
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