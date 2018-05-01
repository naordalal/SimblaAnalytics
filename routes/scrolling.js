var express = require('express');
var router = express.Router();
var bigquery = require('../queries');

router.route('/').post(function(req, res, next) {
    bigquery.insertScrollPercentage(req.body.siteId ,req.body.pageId ,req.body.scroll ,new Date());
});

module.exports = router;

module.exports.getSitesScrollingPercentage = function (siteId) {
    return bigquery.getSiteScrollingPercentage(siteId).then(function (result) {
        return result;
    })
};