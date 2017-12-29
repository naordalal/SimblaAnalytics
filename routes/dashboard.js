var express = require('express');
var router = express.Router();
var bigquery = require('../queries');

/* GET home page. */
router.get('/:siteId', function(req, res, next) {
    //res.render('index', { title: 'Visits: '+require('./users').getVisits()});
    res.render('dashboard', {visits : require('./visit').getVisits(req.params.siteId) , firstVisits : require('./visit').getFirstVisits(req.params.siteId),
    siteId : req.params.siteId})

});

router.get('/', function(req, res, next) {
    //res.render('index', { title: 'Visits: '+require('./users').getVisits()});
    res.render('dashboard', {visits : require('./visit').getVisits('3') , firstVisits : require('./visit').getFirstVisits('3') ,
        siteId : 3})
    //TODO  - TO add menu. (select site - id)
});

//Send countryList to the client.
router.post('/countryList',function (req,res,next) {
    bigquery.getVistsCountByCountry(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });


});

router.post('/graph',function (req,res,next) {
    bigquery.getVistsByHours(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });

});
module.exports = router ;