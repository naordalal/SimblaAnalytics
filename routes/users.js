var express = require('express');
var geoip = require('geoip-lite');

var router = express.Router();
var visits  = 0;


var SSE = require('express-sse');
var sse = new SSE(["array", "containing", "initial", "content", "(optional)"]);

router.route('/').post(function(req, res, next) {
    console.log("New entrance with post");
    console.log(req.ip)

    //TODO: Take care of it before deployment to cloud.
    //console.log(geoip.lookup(req.ip.substr(7))); //Will not work with LAN ip (return null);
    visits = visits +1;
    console.log(visits);
    res.send('respond with a resource');
    sse.send(visits, "NewVisit" , null);
});


module.exports = router;
module.exports.getVisits = function () {
    return visits;
};

module.exports.sse = sse;
