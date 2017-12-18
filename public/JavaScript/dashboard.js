

var es = new EventSource('/visitEvent');


es.addEventListener('NewVisit', function (event) {
        var data = event.data;
        document.getElementById("numVisits").innerText = "Number of Visits: "+ data;
});

es.addEventListener('FirstVisit', function (event) {
    var data = event.data;
    document.getElementById("numFirstVisits").innerText = "First Visits: "+ data;
});