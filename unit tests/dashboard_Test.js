var utils = require('../routes/dashboard')
var bigquery = require('../queries');
var randomstring = require("randomstring");

var siteId = randomstring.generate();
var pageId = randomstring.generate();
var sessionId = randomstring.generate();
var scroll = Math.random() * 100;
var lastDay = 1;
var loadTime = Math.random() * 100000;
var referr = "facebook.com";
var os = "ios";

bigquery.insertScrollPercentage(siteId ,pageId ,scroll ,new Date());
bigquery.insertVisit(siteId, null, new Date().toLocaleString() , 'IL', true , referr , os,loadTime);
bigquery.insertPage(siteId,sessionId ,pageId ,new Date());

setTimeout(function() {

bigquery.getSiteScrollingPercentage(siteId, lastDay).then(res => {
    var actual = res[0].scroll;
    var expected = scroll;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)
});

bigquery.getVistsCountByCountry(siteId,lastDay).then(function (res) {
    var actual = res[0].visits;
    var expected = 1;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)

    actual = res[0].Country;
    expected = 'IL';
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)
});


//Array of json : {PageID , popularity} when popularity is actually visits.
bigquery.getPagePopularity(siteId , lastDay).then(function (res) {
    var actual = res[0].popularity;
    var expected = 1;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)

    actual = res[0].PageID;
    expected = pageId;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)
});

//Send Referr data as : [ { Referr , visits } ]
bigquery.getVisitsCountByReferr(siteId,lastDay).then(function (res) {
    var actual = res[0].visits;
    var expected = 1;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)

    actual = res[0].Referr;
    expected = referr;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)
});


//Send visits by hour , array of jsons  : { timer , f0_ }
bigquery.getVisitsInTheLast24Hours(siteId).then(function (res) {
    var actual = res[0].f0_;
    var expected = 1;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)

    actual = res[0].timer;
    expected = new Date().getHours();
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)
});


//Send visits by OS , array of jsons : { Os , visits }
bigquery.getVisitsCountByOs(siteId,lastDay).then(function (res) {
    var actual = res[0].visits;
    var expected = 1;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)

    actual = res[0].Os;
    expected = os;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)
});

}, 1000); //Wait for insert

setTimeout(function() {console.log('All Dashboard Tests Passed!');}, 6000); //Wait for done


