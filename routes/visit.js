var express = require('express');
var geoip = require('geoip-lite');
var countries  = require('country-list')();
var bigquery = require('../queries');
var router = express.Router();


var SSE = require('express-sse');
var sse = new SSE(["array", "containing", "initial", "content", "(optional)"]);

/*

click-stream
top social traffic(you tube, facebook..)

Bounce rate(percentages of users that leaved from the first page))

 */


router.route('/').post(function(req, res, next) {
    console.log("New entrance with post");
    console.log(req.ip);
    var siteId = req.body.siteId;
    var page= req.body.page;
    var referrer = req.body.referrer;
    var os = req.body.os;
    //var siteURL = req.body.siteURL;
    var siteURL = "4";

    var firstVisit = false;
    if(req.cookies.visited != 'true') //Check if visited before.
    {
        //TODO: save as first visit
        firstVisit = true;
        console.log('first visit');
        sse.send(1, "FirstVisit/" + siteId , null);
    }

    //TODO save visits count per siteId
    //TODO: Take care of it before deployment to cloud.
    var countryCode = 'il';//geoip.lookup(req.ip.substr(7)).country;
    //console.log(countryCode); //Will not work with LAN ip (return null);
    var country = 'Israel';//countries.getName(countryCode);
    //console.log(country);

    console.log(req.session.first);
    if(!req.session.first)
    {
        bigquery.insertVisit(siteId, siteURL, new Date().toLocaleString() , country, firstVisit , referrer , os);
        sse.send(1, "NewVisit/" + siteId , null);
    }

    bigquery.insertPage(siteId,req.session.id ,page ,new Date());
    req.session.first = true;
    req.session.siteId = siteId;

    var nowDate = new Date();
    nowDate.setFullYear(nowDate.getFullYear() + 1);
    res.cookie('visited', 'true' , { expires: nowDate}).send("set cookie");
});


module.exports = router;
module.exports.getVisits = function (siteId) {

   return bigquery.getTotalVisits(siteId).then(function (result) {
       return result;
   })
};
module.exports.getFirstVisits = function (siteId) {
    return bigquery.getTotalFirstVisits(siteId).then(function (result) {
        return result;
    })
};

module.exports.getBounceRate = function (siteId) {
    return bigquery.getBounceRate(siteId).then(function (result) {
        return result;
    })
};

module.exports.getRecencyRate = function (siteId) {
    return bigquery.getRecencyRate(siteId).then(function (result) {
        return result;
    })
};

module.exports.getEngagementRate = function (siteId) {
    return bigquery.getEngagementRate(siteId).then(function (result) {
        return result;
    })
};
module.exports.sse = sse;
