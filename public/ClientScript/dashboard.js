

$(document).ready(function() {
    var es = new EventSource('/visitEvent');
    var siteId = getSiteId();

    es.addEventListener('NewVisit/' + siteId, function (event) {
        var data = event.data;
        document.getElementById("numVisits").innerText = "Number of Visits: "+ data;
    });

    es.addEventListener('FirstVisit/' + siteId, function (event) {
        var data = event.data;
        document.getElementById("numFirstVisits").innerText = "First Visits: "+ data;
    });
});


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
