var $ ;
(function() { //Load JQuery because SimblaSite do not include that.
    // Load the script
    var script = document.createElement("SCRIPT");
    script.src = 'jquery-3.2.1.min.js';
    script.type = 'text/javascript';
    script.onload = function() {
        $ = window.jQuery;
        $(document).ready(visitSite());
    };
    document.getElementsByTagName("head")[0].appendChild(script);
})();


var visitSite = function() {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',"http://132.73.211.244:3000/visit",true); //TODO : Change URL.
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    var siteId = getSiteId();
    var referrer  = document.referrer;
    if(siteId != null)
    {
        var params = "siteId=" + siteId;
        params += "&referrer="+extractRootDomain(referrer);
        xhr.send(params);
    }
};

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
