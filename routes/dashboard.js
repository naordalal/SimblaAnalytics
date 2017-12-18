var express = require('express');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
    //res.render('index', { title: 'Visits: '+require('./users').getVisits()});
    res.render('dashboard', {visits : require('./users').getVisits()})

});

module.exports = router;