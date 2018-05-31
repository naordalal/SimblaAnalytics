var express = require('express');
const rp = require('request-promise');

var URL = require('url');
const  jsdom = require('jsdom');
const {JSDOM} = jsdom;
var router = express.Router();
var bigquery = require('../queries');

var unique = require('array-unique');

//Heatmap route
router.get('/heatmap',async function (req,res,next) {

    var siteId = req.query.siteId;
    //Get points from bigquery

    var url = await getURLFromSiteId(siteId);
    if(!url) {
        res.send('URL not found!')
        return;
    }

    var promise = getHtml(url); //The html content of the required url.
    var points = await bigquery.getAllPointsOfSite(siteId);
    promise.then((dom)=>
    {
        dom = new JSDOM(dom).window.document; //The dom of the html. Used to query the html in convenient way.
        appendTheURL(dom,url);


        var pointsScript = dom.createElement('script');
        pointsScript.innerHTML='var points = '+ JSON.stringify(points)+';';

        var script1 = dom.createElement('script');
        script1.setAttribute('src','../dist/heatmap.js/build/heatmap.min.js')

        var script2 = dom.createElement('script');
        script2.setAttribute('src','../ClientScript/heatmap.js')

        dom.head.appendChild(pointsScript);
        dom.head.appendChild(script1);
        dom.head.appendChild(script2);

        var div = dom.createElement('div')
        div.classList.add('heatmapd922f01521180610c5e000ed93d40af2');

// Move the body's children into this wrapper
        while (dom.body.firstChild)
        {
            div.appendChild(dom.body.firstChild);
        }

// Append the wrapper to the body
        dom.body.appendChild(div);
        res.send(dom.documentElement.outerHTML);
    });

});
function extractURL(url)
{
    var q =URL.parse(url);
    return q.protocol+'//'+q.host+'/';
}

/*
  Changes all realative paths in the html , in a way that the heatmap stub will be able
  to download it. The purpose is to show the page like it seen by a regular visitor.

  In example : url = google.com <img src = "/a.png"/> ==> <img src = "google.com/a.png">

  Moreover, the function delete the script that used for monitor the site.
 */
function appendTheURL(dom,url)
{
    url = extractURL(url);

    updateScripts(dom,url);
    updateStyles(dom,url);
    updateImages(dom,url);
}

/*
    Update the relative paths that used to download css files.
 */
function updateStyles(dom,url)
{
    styles = dom.getElementsByTagName('link');

    for(let i = 0 ; i < styles.length; i++)
    {
        var style = styles[i];
        var q = undefined;
        if(style.getAttribute('href') != null)
            q = URL.parse(style.getAttribute('href'));
        else
            continue;
        if(!q.host) {
            if (style.getAttribute('href').startsWith('//'))
                style.setAttribute('href', 'http://' + style.getAttribute('href').substring(2));
            else if(style.getAttribute('href').startsWith('/'))
                style.setAttribute('href', url + style.getAttribute('href').substring(1));
            else
                style.setAttribute('href', url + style.getAttribute('href'));
        }

    }
}
/*
    Update the relative paths that used to download images to the browser.
 */
function updateImages(dom,url)
{
    images = dom.getElementsByTagName('image')

    for(let i = 0 ; i < images.length; i++)
    {
        var img = images[i];
        var q = undefined;
        if(img.getAttribute('src') != null)
            q = URL.parse(img.getAttribute('src'));
        else
            continue;
        if(!q.host)
            if (img.getAttribute('src').startsWith('//'))
                img.setAttribute('src', 'http://' + img.getAttribute('src').substring(2));
            else if(img.getAttribute('src').startsWith('/'))
                img.setAttribute('src', url + img.getAttribute('src').substring(1));
            else
                img.setAttribute('src', url + img.getAttribute('src'));
    }
}

/*
    Update the relative paths that used to download scripts, and delete the script that used for monitoring the site.
 */
function updateScripts(dom,url)
{
    scripts = dom.getElementsByTagName('script');

    for(let i = scripts.length-1 ; i >= 0; i--)
    {
        var script = scripts[i];

        var q = undefined;
        if(script.getAttribute('src') != null) {
            q = URL.parse(script.getAttribute('src'));

            if (!q.host)
                if (script.getAttribute('src').startsWith('//'))
                    script.setAttribute('src', 'http://' + script.getAttribute('src').substring(2));
                else if(script.getAttribute('src').startsWith('/'))
                    script.setAttribute('src', url + script.getAttribute('src').substring(1));
                else
                    script.setAttribute('src', url + script.getAttribute('src'));

        }

        if (script.innerHTML.includes('87f2f749d683945ddcf25ec6a473b9bc')) {
            var father = script.parentElement;
            father.removeChild(script);
        }

    }
}

/* GET dashboard page. */
router.get('/:siteId', async function(req, res, next) {


    var visits = require('./visit').getVisits(req.params.siteId);
    var firstVisits = require('./visit').getFirstVisits(req.params.siteId);
    var bounceRate = require('./visit').getBounceRate(req.params.siteId);
    var engaRate = require('./visit').getEngagementRate(req.params.siteId);
    var recencyRate = require('./visit').getRecencyRate(req.params.siteId);
    var loadTime = require('./visit').getAverageLoadTime(req.params.siteId);
    var bestDay  = bigquery.getVisitsByHourOfTheDay(req.params.siteId);
    

    bounceRate = await bounceRate;
    bounceRate = Math.round(bounceRate*100)/100;

    engaRate = await engaRate;
    engaRate = Math.round(engaRate[0].avg*100)/100;

    recencyRate = await recencyRate;
    recencyRate = Math.round(recencyRate*100)/100;

    loadTime = await loadTime;
    loadTime = Math.round(loadTime[0].avg*100)/100;

    bestDay = await bestDay;

    array = [];
    for(var i = 0 ; i < 7 ; i++)
    {
        var sum = bestDay.filter(el => el.day == i).reduce((x,y) => x + y.visits , 0);
        array.push(sum);
    }

    bestDay = array.indexOf(Math.max(...array));

    visits = await visits;
    firstVisits = await firstVisits;

    res.render('dashboard', {visits : visits[0].visits , firstVisits : firstVisits[0].visits, bounceRate : bounceRate,
        engagementRate: engaRate, recencyRate : recencyRate/*[0].visits*/,
        loadTime : loadTime , siteId : req.params.siteId, bestDay: getDayName(bestDay+1)});
});

function getDayName(day)
{
    if(day>7)
        return "";
    var days = ["","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    return days[day];
}


router.get('/', function(req, res, next) {
    //res.render('index', { title: 'Visits: '+require('./users').getVisits()});
  //  res.render('dashboard', {visits : require('./visit').getVisits('3') , firstVisits : require('./visit').getFirstVisits('3') ,
      //  siteId : 3})
    //TODO  - TO add menu. (select site - id)
    res.redirect('/dashboard/3')
});


/*
    The post methods that used to get information for the graphs on the dashboard.
 */

//Send countryList to the client as array of jsons : {Country , visits}
router.post('/countryList',function (req,res,next) {
    bigquery.getVistsCountByCountry(req.body.siteId,req.body.time).then(function (results) {
        res.send(JSON.stringify(results));
    });
});

//Array of json : {PageID , popularity}
router.post('/PageList',function (req,res,next) {
    bigquery.getPagePopularity(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });
});

//Send Referr data as : [ { Referr , visits } ]
router.post('/ReferrList',function (req,res,next) {
    bigquery.getVisitsCountByReferr(req.body.siteId,req.body.time).then(function (results) {
        res.send(JSON.stringify(results));
    });
});

//Send visits by hour , array of jsons  : { Timer , _f0 }
router.post('/graph',function (req,res,next) {
    bigquery.getVisitsInTheLast24Hours(req.body.siteId).then(function (results) {
        res.send(JSON.stringify(results));
    });

});

//Send visits by OS , array of jsons : { Os , visits }
router.post('/pieChart',function (req,res,next) {
    bigquery.getVisitsCountByOs(req.body.siteId,req.body.time).then(function (results) {
        res.send(JSON.stringify(results));
    });
});

//Array of json : {PageID , popularity} when popularity is actually visits.
router.post('/pageViews',function (req,res,next) {
    bigquery.getPagePopularity(req.body.siteId,req.body.time).then(function (results) {
        res.send(JSON.stringify(results));
    });
});

//Array of jsons : {PageId , scroll} when scroll is the average percentage of scrolling in the page.
router.post('/scrolling',async function (req,res,next) {
    var results = await bigquery.getSiteScrollingPercentage(req.body.siteId,req.body.time);
    res.send(JSON.stringify(results));
});

/*
    This method send the campaign data. The data format matches to google charts treemap format.
 */
router.post('/Campaigns',async function (req,res,next) {
    var results = [['Global',null,0]];
    var results1 = bigquery.getSourcesCampaigns(req.body.siteId);
    var results2 = bigquery.getCampaignsData(req.body.siteId);

    results1 = await results1;
    var sources = results1.map(res => res.utm_source);
    unique(sources);
    sources = sources.map(source => {return {source:source , count:results1.filter(res => res.utm_source == source).reduce((res1,res2) => res1+res2.count , 0)}});

    results = results.concat(sources.map(res => [res.source , 'Global' , res.count]));
    
    results1 = results1.map(res => [{v:res.utm_source + "_" + res.utm_campaign,f : res.utm_campaign} , res.utm_source , res.count]);

    results2 = await results2;
    results2 = results2.map(res => [{v:res.utm_source + "_" + res.utm_campaign + "_" + res.utm_medium, f: res.utm_medium} , res.utm_source + "_" + res.utm_campaign , res.count]);

    results = results.concat(results1.concat(results2));

    res.send(JSON.stringify(results));
});

/*
    Send the data about each hour of week days, Calculates the popularity of the site in a way
    that peak in a single day of the year will not affect the results.

    For example if every tuesday at 5 pm the site has 50 visits and suddenly week after
    in the same hours the site has 500 visits, the results from this query will be affect in a minor way.
  */
router.post('/houroftheday',async function (req,res,next) {
    var results = await bigquery.getVisitsByHourOfTheDay(req.body.siteId);
    res.send(JSON.stringify(results));
});


//+++++++++++HEATMAP+++++




module.exports = router ;

function getHtml(url)
{
    return rp(url);
}


//I want to be sure that the url is valid and it is the most common url
async function getURLFromSiteId(siteId)
{
    var json = await bigquery.getURLsBySiteId(siteId);

    return getBestURL(json)
}

function getBestURL(json)
{
    json = json.filter(obj => extractURL(obj.url).includes('http'));
    if (json.length == 0)
        return false;
    if(json.length == 1)
        return json[0].url;
    return json.sort((a,b) => {return  b.quantity - a.quantity;})[0].url;
}
/*
getHtml('https://www.escaperoomin.com').then((html)=>
{
    var dom = new JSDOM(html);

    console.log(dom.window.document.documentElement.outerHTML);
})
*/


//module.exports = {
   // getBestURL : getBestURL,
//};
