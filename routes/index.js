var express = require('express');
var router = express.Router();

var LOL = require('../controller/lol-api');

/* GET home page */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.post('/summoner', function(req, res, next) {
    var summonerName = req.body.summonerName;
    res.redirect('/summoner/' + summonerName);
});
    
router.get('/summoner/:summonerName', function(req, res, next) {
    var summonerName = req.params.summonerName;
    
    LOL.getRecentGamesByName(summonerName, function(err, result){
        if(err)
            res.status(404).end()
        
        if(!result)
            result = {games: []};
        
        var games = result.games;
        
        res.render('games', {
            title: 'Games - ' + summonerName,
            summonerName: summonerName,
            games: games
        });
    });
});

router.get('/match/:matchId', function(req, res, next) {
    LOL.getMatchIncludeTimeline(req.params.matchId, function(err, result){
        if(err)
            res.status(404).end();
        
        if(!result)
            res.status(404).end();
        
        try {
            res.render('match', {
                title: 'Match - ' + req.params.matchId,
                match: {
                    id: result.matchId,
                    mode: result.matchMode,
                    type: result.matchType,
                    creation: result.matchCreation,
                    duration: result.matchDuration,
                    mapId: result.mapId
                },
                participants: result.participants,
                participantsIdentities: result.participantIdentities,
                timeline: LOL.timelineBeautyForChamps(result.timeline),
                eventTimeline: LOL.timelineBeautyForEvents(result.timeline),
                champsSnapshots: LOL.generateChampionsSnapshots(result.timeline)
            });
        } catch (e){
            res.render('error', {
                message: 'Error',
                error: e
            });
        } finally {
            res.status(500).end();
        }
    });
});

router.get('/match2/:matchId', function(req, res, next) {
    LOL.getMatchIncludeTimeline(req.params.matchId, function(err, result){
        if(err)
            res.status(404).end();
        
        if(!result)
            res.status(404).end();
        
        try {
            res.render('match2', {
                title: 'Match - ' + req.params.matchId,
                match: {
                    id: result.matchId,
                    mode: result.matchMode,
                    type: result.matchType,
                    creation: result.matchCreation,
                    duration: result.matchDuration,
                    mapId: result.mapId
                },
                participants: result.participants,
                participantsIdentities: result.participantIdentities,
                timeline: LOL.timelineBeautyForChamps(result.timeline),
                eventTimeline: LOL.timelineBeautyForEvents(result.timeline),
                champsSnapshots: LOL.generateChampionsSnapshots(result.timeline),
                timeline2: LOL.generateTimeline2OfMatch(result.timeline)
            });
        } catch (e){
            res.render('error', {
                message: 'Error',
                error: e
            });
        } finally {
            res.status(500).end();
        }
    });
});

router.get('/test/:matchId', function(req, res, next) {
    LOL.getJsonTimelineOfMatch(req.params.matchId, function(err, result){
        if(err || ! result)
            res.status(404).end()
        
        res.render('test', {
            title: 'Test',
            timeline: LOL.timelineBeautyForEvents(result)
        });
    });
});

module.exports = router;
