var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/:siteId', function(req, res, next) {
    //res.render('index', { title: 'Visits: '+require('./users').getVisits()});
    res.render('dashboard', {visits : require('./visit').getVisits(req.params.siteId) , firstVisits : require('./visit').getFirstVisits(req.params.siteId)})

});

router.get('/', function(req, res, next) {
    //res.render('index', { title: 'Visits: '+require('./users').getVisits()});
    res.render('dashboard', {visits : require('./visit').getVisits(3) , firstVisits : require('./visit').getFirstVisits(3)})
    //TODO  - TO add menu. (select site - id)
});

module.exports = router;