var express = require('express');
var geoip = require('geoip-lite');
var countries  = require('country-list')();
var bigquery = require('../queries');
var router = express.Router();
const uuidv1 = require('uuid/v1');
var URL = require('url')
var SSE = require('express-sse');
var sse = new SSE(["array", "containing", "initial", "content", "(optional)"]);

/*

click-stream
top social traffic(you tube, facebook..)

Bounce rate(percentages of users that leaved from the first page))

 */


router.route('/').post(function(req, res, next) {
    var siteId = req.body.siteId;
    var page= req.body.pageId;
    var referrer = req.body.referrer;
    var os = req.body.os;
    var siteURL = req.body.siteURL;
    var loadTime = req.body.loadTime;

    var firstVisit = false;
    if(req.cookies.visited == undefined || !req.cookies.visited.split("-").includes(siteId)) //Check if visited before.
    {
        //TODO: save as first visit
        firstVisit = true;
        console.log('first visit');
        sse.send(1, "FirstVisit/" + siteId , null);
    }

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    var ipAddr;
    if(ip) {
        ipAddr = ip.split(',');
        console.log(ipAddr[0]);
        ipAddr = ipAddr[0]
        if(ipAddr) {
            countryCode = geoip.lookup(ipAddr).country;
            //Will not work with LAN ip (return null);
            var country = 'Israel';//countries.getName(countryCode);
            country = countries.getName(countryCode);
            console.log(country);
        }
    }

    if(!ipAddr)
    {
        ipAddr = req.connection.remoteAddress;
        countryCode = geoip.lookup(ipAddr).country;
        //Will not work with LAN ip (return null);
        var country = 'Israel';//countries.getName(countryCode);
        country = countries.getName(countryCode);
        console.log(country);
    }


    if(req.session.first == undefined)
    {
        bigquery.insertVisit(siteId, siteURL, new Date().toLocaleString() , country, firstVisit , referrer , os,loadTime);
        sse.send(1, "NewVisit/" + siteId , null);
        req.session.first = siteId +'';

    }
    else
    {
        var includeSiteId = req.session.first.split("-").includes(siteId);
        if(!includeSiteId)
        {
            bigquery.insertVisit(siteId, siteURL, new Date().toLocaleString() , country, firstVisit , referrer , os,loadTime);
            sse.send(1, "NewVisit/" + siteId , null);
            req.session.first += '-' + siteId;
        }
    }

    if(req.session.id == undefined)
    {
        var sessionId = uuidv1();
        var json = {}
        json[siteId] = sessionId;
        req.session.id = JSON.stringify(json)
    }
    else
    {
        var sessionId = uuidv1();
        var sessionJson = JSON.parse(req.session.id);
        if(!sessionJson.hasOwnProperty(siteId))
        {
            sessionJson[siteId] = sessionId;
        }
        req.session.id = JSON.stringify(sessionJson);
    }

    var sessionJson = JSON.parse(req.session.id);
    bigquery.insertPage(siteId,sessionJson[siteId] ,page ,new Date());
    insertCampaign(siteURL,siteId);
    req.session.siteId = siteId;

    var nowDate = new Date();
    nowDate.setFullYear(nowDate.getFullYear() + 1);
    var visited = req.cookies.visited;
    if(visited == undefined)
        visited = '';
    if(firstVisit)
        visited += "-" + siteId;

    res.cookie('visited', visited , { expires: nowDate}).send("set cookie");
});

function insertCampaign(siteUrl,siteId)
{
    var urlObject = URL.parse(siteUrl);
    var params = urlObject.query; //Return empty jsom if there is no parameters.
    var utm_source = params.utm_source; //The site that send the traffic. required.
    if(utm_source == undefined)
        return;
    
    var utm_medium = params.utm_medium;
    var utm_content = params.utm_content;
    var utm_term = params.utm_term;
    var utm_campaign = params.utm_campaign; //the name of the marketing campaign.

    bigquery.insertCampaignData(siteId,utm_source,utm_campaign,utm_medium,utm_content,utm_term,new Date());
}


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

module.exports.getAverageLoadTime = function (siteId) {
    return bigquery.getAverageLoadTime(siteId).then(function (result) {
        return result;
    })
};
module.exports.sse = sse;
