var findMe = '87f2f749d683945ddcf25ec6a473b9bc';
var timerStart = Date.now();
const serverURL = "http://192.168.0.103:3000"////"http://simbla-analytics.appspot.com" //http://localhost:3000'

var maxScrollPercentage = 0;

/*
if(0)
{//Load JQuery because Simbla's sites do not load it.
    // Load the script
    var $ ;
    var script = document.createElement("SCRIPT");
    script.src = 'jquery-3.2.1.min.js';
    script.type = 'text/javascript';
    console.log('no Jquery');
    script.onload = function() {
        $ = window.jQuery;
        $(document).ready(visitSite);

    };
    document.getElementsByTagName("head")[0].appendChild(script);
}
else{
    console.log('yes jquery');
    $(document).ready(visitSite);
}

*/
//Notify server about visit
window.onload = function() {
    var loadTime = Date.now() - timerStart;
    console.log('visit!')
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',serverURL+"/visit",true); //TODO : Change URL.
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    SiteId = getSiteId();
    PageId = getPageId();
    var referrer  = document.referrer;
    if(SiteId != null)
    {
        var params = "siteId=" + SiteId;
        params += "&pageId=" + PageId;
        params += "&referrer="+extractRootDomain(referrer);
        params += "&os="+getOs();
        params += "&siteURL="+document.URL;
        params += "&loadTime="+loadTime;
        xhr.send(params);
    }

};

window.onscroll = function() {
    var scrollPercentage = window.scrollY / (document.documentElement.scrollHeight - document.body.clientHeight) * 100;

    if(maxScrollPercentage < scrollPercentage)
        maxScrollPercentage = scrollPercentage;
}

window.onbeforeunload = function()
{
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',serverURL+"/scrolling",false); //TODO : Change URL.
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    var params = "siteId=" + SiteId;
    params += "&pageId=" + PageId;
    params += "&scroll=" + maxScrollPercentage;
    xhr.send(params);

}


var locations = []; //To use later for sending amount of points instead of one point at a time.

//Send mouse location
var sendMouseLoc = function (event) {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',serverURL+"/heatmap",true); //TODO : Change URL.
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    console.log(event.pageX+","+event.pageY)
    var siteId = getSiteId();
    if(siteId != null)
    {
        // locations.push({X: event.clientX , Y: event.clientY});

        var params = "siteId=" + siteId;
        params += "&X="+event.pageX;
        params += "&Y="+event.pageY;
        console.log(params);
        xhr.send(params);

    }
}

//For now only for clicks
document.onclick=sendMouseLoc;


/* Sending collection of points instead of one at a time.
var sendMouseLoc = function()
{
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',"http://132.73.211.244:3000/heatmap",true); //TODO : Change URL.
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    xhr.send({siteId:getSiteId(),locations:locations});
}*/

//Scrapping the siteID from the site.
function getSiteId()
{
    var elements = document.getElementsByName("page-source");
    var siteId = null;
    for (var i = 0; i < elements.length; ++i)
    {
        var elem = elements[i];
        if(elem.tagName == 'META')
        {
            siteId = elem.getAttribute("site-id");
            break;
        }
    }

    return siteId;
}



function getPageId()
{
    var elements = document.getElementsByName("page-source");
    var pageId = null;
    for (var i = 0; i < elements.length; ++i)
    {
        var elem = elements[i];
        if(elem.tagName == 'META')
        {
            pageId = elem.getAttribute("page");
            break;
        }
    }

    return pageId;
}

function extractHostname(url) {
    var hostname;
    //find & remove protocol (http, ftp, etc.) and get hostname

    if (url.indexOf("://") > -1) {
        hostname = url.split('/')[2];
    }
    else {
        hostname = url.split('/')[0];
    }

    //find & remove port number
    hostname = hostname.split(':')[0];
    //find & remove "?"
    hostname = hostname.split('?')[0];

    return hostname;
}

function extractRootDomain(url) {
    var domain = extractHostname(url),
        splitArr = domain.split('.'),
        arrLen = splitArr.length;

    //extracting the root domain here
    //if there is a subdomain
    if (arrLen > 2) {
        domain = splitArr[arrLen - 2] + '.' + splitArr[arrLen - 1];
        //check to see if it's using a Country Code Top Level Domain (ccTLD) (i.e. ".me.uk")
        if (splitArr[arrLen - 2].length == 2 && splitArr[arrLen - 1].length == 2) {
            //this is using a ccTLD
            domain = splitArr[arrLen - 3] + '.' + domain;
        }
    }
    return domain;
}

//get the operating system of the visitor.
function getOs()
{
    var OSName="Unknown OS";
    if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
    else if (navigator.appVersion.indexOf("like Mac OS")!=-1) OSName="ios";
    else if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
    else if (navigator.appVersion.indexOf("Android")!=-1) OSName="Android";
    else if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
    else if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";

    return OSName;
}
