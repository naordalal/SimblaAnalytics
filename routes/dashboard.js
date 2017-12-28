var express = require('express');
var router = express.Router();
var countryList = [{
    name: 'John Smith',
    phone: '+78503569987'},{name: 'Ohad Dali', phone:'0525302429'}];

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
router.post('/',function (req,res,next) {

   res.send(JSON.stringify(countryList));
});
module.exports = router;