var express = require('express');
const rp = require('request-promise')
const http = require('http')
const  jsdom = require('jsdom')
const {JSDOM} = jsdom;
var router = express.Router();
var bigquery = require('../queries');

router.get('/heatmap',async function (req,res,next) {

    var siteId = req.query.siteId;
    //Get points from bigquery
    var url = 'https://www.escaperoomin.com/'
    var promise = getHtml(url);
    var points = await bigquery.getAllPointsOfSite(siteId);
    promise.then((dom)=>
    {
        dom = new JSDOM(dom).window.document
        //appendTheURL(dom,url);

        dom.body.classList.add('heatmapd922f01521180610c5e000ed93d40af2');

        var pointsScript = dom.createElement('script');
        pointsScript.innerHTML='var points = '+ JSON.stringify(points)+';';

        var script1 = dom.createElement('script');
        script1.setAttribute('src','../dist/heatmap.js/build/heatmap.min.js')

        var script2 = dom.createElement('script');
        script2.setAttribute('src','../ClientScript/heatmap.js')

        dom.head.appendChild(pointsScript);
        dom.head.appendChild(script1);
        dom.head.appendChild(script2);
        res.send(dom.documentElement.outerHTML);
    });

});

function appendTheURL(dom,url)
{
    scripts = dom.getElementsByTagName('script');
    styles = dom.getElementsByTagName('link')
    images = dom.getElementsByTagName('image')


    for(let i = 0 ; i < scripts.length; i++)
    {
        var script = scripts[i];

        if(script.getAttribute('src') != null &&script.getAttribute('src').startsWith('/'))
            if (script.getAttribute('src').startsWith('//'))
                script.setAttribute('src', url + script.getAttribute('src').substring(2));
            else
                script.setAttribute('src', url + script.getAttribute('src').substring(1));

    }
    for(let i = 0 ; i < styles.length; i++)
    {
        var style = styles[i];

        if(style.getAttribute('href')!=null && style.getAttribute('href').startsWith('/'))
            if (style.getAttribute('href').startsWith('//'))
                style.setAttribute('href', url + style.getAttribute('href').substring(2));
            else
                style.setAttribute('href', url + style.getAttribute('href').substring(1));
    }

    for(let i = 0 ; i < images.length; i++)
    {
        var img = images[i];
        if(img.getAttribute('src') != null && img.getAttribute('src').startsWith('/'))
            if (img.getAttribute('src').startsWith('//'))
                img.setAttribute('src', url + img.getAttribute('src').substring(2));
            else
                img.setAttribute('src', url + img.getAttribute('src').substring(1));
    }
}

/* GET dashboard page. */
router.get('/:siteId', function(req, res, next) {
    //res.render('index', { title: 'Visits: '+require('./users').getVisits()});
    require('./visit').getVisits(req.params.siteId).then(res1 =>{
        require('./visit').getFirstVisits(req.params.siteId).then(res2 =>{
            require('./visit').getBounceRate(req.params.siteId).then(res3 =>{
                require('./visit').getEngagementRate(req.params.siteId).then(res4 =>{
                    require('./visit').getRecencyRate(req.params.siteId).then(res5 =>{
                        res.render('dashboard', {visits : res1[0].visits , firstVisits : res2[0].visits, bounceRate : res3,
                            engagementRate: res4[0].avg, recencyRate : res5/*[0].visits*/, siteId : req.params.siteId})
                    });
                });
            });
        });
    });
    //res.render('dashboard', {visits : require('./visit').getVisits(req.params.siteId) , firstVisits : require('./visit').getFirstVisits(req.params.siteId),
    //siteId : req.params.siteId})

});


router.get('/', function(req, res, next) {
    //res.render('index', { title: 'Visits: '+require('./users').getVisits()});
  //  res.render('dashboard', {visits : require('./visit').getVisits('3') , firstVisits : require('./visit').getFirstVisits('3') ,
      //  siteId : 3})
    //TODO  - TO add menu. (select site - id)
    res.redirect('/dashboard/3')
});

//Send countryList to the client.
router.post('/countryList',function (req,res,next) {
    bigquery.getVistsCountByCountry(req.body.siteId).then(function (results) {

        res.send(JSON.stringify(results));
    });
});

router.post('/PageList',function (req,res,next) {
    bigquery.getPagePopularity(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });
});

//Send Referr data
router.post('/ReferrList',function (req,res,next) {
    bigquery.getVisitsCountByReferr(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });
});

//Send visits by hour
router.post('/graph',function (req,res,next) {
    bigquery.getVisitsByHours(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });

});

//Send visits by OS
router.post('/pieChart',function (req,res,next) {
    bigquery.getVisitsCountByOs(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });
});

router.post('/pageViews',function (req,res,next) {
    bigquery.getPagePopularity(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });
});



//+++++++++++HEATMAP+++++




module.exports = router ;

function getHtml(url)
{
    return rp(url);
}
/*
getHtml('https://www.escaperoomin.com').then((html)=>
{
    var dom = new JSDOM(html);

    console.log(dom.window.document.documentElement.outerHTML);
})
*/



