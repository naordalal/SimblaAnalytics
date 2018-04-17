var express = require('express');
var router = express.Router();
var bigquery = require('../queries');




router.route('/').post(function(req, res, next) {
    var siteId = req.body.siteId;
    var X = req.body.X;
    var Y = req.body.Y;

    bigquery.insertMouseLoc(siteId,X,Y);
    res.send("newClick");
});


module.exports = router;

