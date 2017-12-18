

var es = new EventSource('/visitEvent');


es.addEventListener('NewVisit', function (event) {
        var data = event.data;
        console.log("dsad")
        document.getElementById("numVisits").innerText = "Number of Visits: "+ data;
});