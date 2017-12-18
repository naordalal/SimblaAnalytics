var express = require('express');
var geoip = require('geoip-lite');

var router = express.Router();
var visits  = 0;

router.route('/').post(function(req, res, next) {
    console.log("New entrance with post");
    console.log(req.ip)
    console.log(visits);
    //TODO: Take care of it before deployment to cloud.
    //console.log(geoip.lookup(req.ip.substr(7))); //Will not work with LAN ip (return null);
    visits = visits +1;
    res.send('respond with a resource');
}).
get(function(req, res, next) {
  console.log("New entrance");
  res.send('respond with a resource');
});

module.exports = router;
module.exports.getVisits = function () {
    return visits;
};
