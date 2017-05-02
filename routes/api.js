var express = require('express');
var router = express.Router();

var LOL = require('../controller/lol-api');

router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

// JSON ========================================================================

/**
 *  Results By Summoner
 * 
 */
router.get('/summoner/:summonerName', function(req, res, next) {
    LOL.getSummonerByName(req.params.summonerName, function(err, result){
        if(err)
            res.status(404);
        res.json(result).end();
    });
});

router.get('/summoner/:summonerName/game/latest', function(req, res, next) {
    LOL.getLatestGameByName(req.params.summonerName, function(err, result){
        if(err)
            res.status(404);
        res.json(result).end();
    });
});

router.get('/summoner/:summonerName/game/recent', function(req, res, next) {
    LOL.getRecentGamesByName(req.params.summonerName, function(err, result){
        if(err)
            res.status(404);
        res.json(result).end();
    });
});

/**
 *  Results By Match
 * 
 */
router.get('/match/:matchId', function(req, res, next) {
    LOL.getMatchIncludeTimeline(req.params.matchId, function(err, result){
        if(err)
            res.status(404);
        res.json(result).end();
    });
});

router.get('/match/:matchId/timeline', function(req, res, next) {
    LOL.getJsonTimelineOfMatch(req.params.matchId, function(err, result){
        if(err)
            res.status(404);
        res.json(result).end();
    });
});

router.get('/match/:matchId/timeline/types', function(req, res, next) {
    LOL.getEventTypesOfGame(req.params.matchId, function(err, result){
        if(err)
            res.status(404);
        res.json(result).end();
    });
});

router.get('/match/:matchId/timeline/beauty', function(req, res, next) {
    LOL.getTimelineOfMatch(req.params.matchId, function(err, result){
        if(err)
            res.status(404);
        res.json(result).end();
    });
});

router.get('/match/:matchId/snaps', function(req, res, next) {
    LOL.getJsonTimelineOfMatch(req.params.matchId, function(err, result){
        if(err)
            res.status(404);
        res.json(LOL.generateChampionsSnapshot(result)).end();
    });
});

/**
 * Test course
 **/
router.get('/match/:matchId/timeline2', function(req, res, next) {
    LOL.getTimeline2OfMatch(req.params.matchId, function(err, result){
        if(err)
            res.status(404);
        res.json(result).end();
    });
});


module.exports = router;
