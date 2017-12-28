var express = require('express');
var geoip = require('geoip-lite');
var countries  = require('country-list')();

var router = express.Router();


var SSE = require('express-sse');
var sse = new SSE(["array", "containing", "initial", "content", "(optional)"]);


//TODO - delete when database is working.
var HashMap = require('hashmap');
var sitePerVisits = new HashMap();
var sitePerFirstVisits = new HashMap();
var countryPerVisits = new HashMap();

router.route('/').post(function(req, res, next) {
    console.log("New entrance with postt");
    console.log(req.ip);
    var siteId = req.body.siteId;
    var visits = (sitePerVisits.get(siteId) == undefined) ? 0 : sitePerVisits.get(siteId);
    var firstVisits = (sitePerFirstVisits.get(siteId) == undefined) ? 0 : sitePerFirstVisits.get(siteId);

    if(req.cookies.visited != 'true') //Check if visited before.
    {
        //TODO: save as first visit
        firstVisits++;
        console.log('first visit');
    }

    //TODO save visits count per siteId
    //TODO: Take care of it before deployment to cloud.
    var countryCode = geoip.lookup(req.ip.substr(7)).country;
    console.log(countryCode); //Will not work with LAN ip (return null);
    var country = countries.getName(countryCode);
    console.log(country);
    visits++;
    console.log(visits);
    sitePerVisits.set(siteId , visits);
    sitePerFirstVisits.set(siteId , firstVisits);
    countryPerVisits.set(countryCode.toLowerCase() , visits);

    //update the dashboard in realTime.
    sse.send(visits, "NewVisit/" + siteId , null);
    sse.send(firstVisits, "FirstVisit/" + siteId , null);

    res.cookie('visited', 'true').send("set cookie");
});

router.route('/getVisitsCount').post(function(req, res, next) {
    var countryCode = req.body.countryCode;
    var visitsCount = (countryPerVisits.get(countryCode) == undefined) ? 0 : countryPerVisits.get(countryCode);
    var param = {name :  countries.getName(countryCode).toString() , count : visitsCount.toString()};
    res.send(JSON.stringify(param));
});


module.exports = router;
module.exports.getVisits = function (siteId) {
    return (sitePerVisits.get(siteId) == undefined) ? 0 : sitePerVisits.get(siteId);
};
module.exports.getFirstVisits = function (siteId) {
    return (sitePerFirstVisits.get(siteId) == undefined) ? 0 : sitePerFirstVisits.get(siteId);
};
module.exports.getCountryVisits = function (countryCode) {
    return (countryPerVisits.get(countryCode) == undefined) ? 0 : countryPerVisits.get(countryCode);
};

module.exports.sse = sse;
