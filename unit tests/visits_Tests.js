var utils = require('../routes/visit')
var bigquery = require('../queries');
var randomstring = require("randomstring");

var siteId = randomstring.generate();
var pageId = randomstring.generate();
var sessionId = randomstring.generate();
var loadTime = Math.random() * 100000;

bigquery.insertVisit(siteId, null, new Date().toLocaleString() , null, true , null , null,loadTime);
bigquery.insertPage(siteId,sessionId ,pageId ,new Date());

setTimeout(function() {

utils.getVisits(siteId).then(res => {
    var actual = res[0].visits;
    var expected = 1;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)
});

utils.getFirstVisits(siteId).then(res => {
    var actual = res[0].visits;
    var expected = 1;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)

});

utils.getRecencyRate(siteId).then(res => {
    var actual = res;
    var expected = 0;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)

});

utils.getAverageLoadTime(siteId).then(res => {
    var actual = res[0].avg;
    var expected = loadTime;
    console.assert(expected == actual,'Test1 Failed : Expected:' + expected +' , Got: ' +actual)

});

}, 1000); //Wait for insert

setTimeout(function() {console.log('All Visits Tests Passed!');}, 6000); //Wait for done