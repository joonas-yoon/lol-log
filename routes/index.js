var express = require('express');
var router = express.Router();

var LOL = require('../controller/lol-api');

/* GET home page */
router.get('/', function(req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/test', function(req, res, next) {
    res.render('test', { title: 'Test' });
});

router.post('/summoner', function(req, res, next) {
    var summonerName = req.body.summonerName;
    res.redirect('/summoner/' + summonerName);
});
    
router.get('/summoner/:summonerName', function(req, res, next) {
    var summonerName = req.params.summonerName;
    
    LOL.getRecentGamesByName(summonerName, function(err, result){
        if(err)
            res.status(404);
        
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
    LOL.getTimelineOfMatch(req.params.matchId, function(err, timelineJson){
        if(err || ! timelineJson)
            res.status(404);
            
        res.render('match', {
            title: 'Match - ' + req.params.matchId,
            timeline: timelineJson
        });
    });
});

module.exports = router;
