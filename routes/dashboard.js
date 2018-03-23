var express = require('express');
var router = express.Router();
var bigquery = require('../queries');
/* GET home page. */
router.get('/:siteId', function(req, res, next) {
    //res.render('index', { title: 'Visits: '+require('./users').getVisits()});
    require('./visit').getVisits(req.params.siteId).then(res1 =>{
        require('./visit').getFirstVisits(req.params.siteId).then(res2 =>{
            require('./visit').getBounceRate(req.params.siteId).then(res3 =>{
                require('./visit').getEngagementRate(req.params.siteId).then(res4 =>{
                    require('./visit').getRecencyRate(req.params.siteId).then(res5 =>{
                        res.render('dashboard', {visits : res1[0].visits , firstVisits : res2[0].visits, bounceRate : res3,
                            engagementRate: res4[0].avg, recencyRate : res5/*[0].visits*/, siteId : req.params.siteId})
                    });
                });
            });
        });
    });
    //res.render('dashboard', {visits : require('./visit').getVisits(req.params.siteId) , firstVisits : require('./visit').getFirstVisits(req.params.siteId),
    //siteId : req.params.siteId})

});


router.get('/', function(req, res, next) {
    //res.render('index', { title: 'Visits: '+require('./users').getVisits()});
  //  res.render('dashboard', {visits : require('./visit').getVisits('3') , firstVisits : require('./visit').getFirstVisits('3') ,
      //  siteId : 3})
    //TODO  - TO add menu. (select site - id)
    res.redirect('/dashboard/3')
});

//Send countryList to the client.
router.post('/countryList',function (req,res,next) {
    bigquery.getVistsCountByCountry(req.body.siteId).then(function (results) {

        res.send(JSON.stringify(results));
    });
});

router.post('/PageList',function (req,res,next) {
    bigquery.getPagePopularity(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });
});

router.post('/ReferrList',function (req,res,next) {
    bigquery.getVisitsCountByReferr(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });
});
router.post('/graph',function (req,res,next) {
    bigquery.getVisitsByHours(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });

});

router.post('/pieChart',function (req,res,next) {
    bigquery.getVisitsCountByOs(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });
});


module.exports = router ;
