

var es = new EventSource('/visitEvent');
var countryMap = new Map();
var myChart;
var ctx;
var gdpData = {};
var paintMap = function () {
    console.log("empty Function ... look at map.js")
}

function getCountryList()
{

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',"/dashboard/countryList",true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";
    xhr.onload =function(next) {

        if(xhr.readyState==4) {
            var countryList = xhr.response;
            var list = document.getElementById('countries');
            var i;
            for (i = 0; i < countryList.length; i++) //Add the list to the view.
            {

                countryMap.set(countryList[i].Country.toUpperCase(), countryList[i].visits);
                gdpData[getCountryCode(countryList[i].Country).toLowerCase()] = countryList[i].visits;


                var entry = document.createElement('li');
                var country = document.createTextNode(countryList[i].Country);
                var flag = document.createElement('img');
                flag.setAttribute("src", "https://raw.githubusercontent.com/hjnilsson/country-flags/master/png100px/il.png")
                var quantity = document.createTextNode(countryList[i].visits);

                entry.setAttribute("class", "countryEntry");
                flag.setAttribute("class", "flag");

                entry.appendChild(country);
                entry.appendChild(flag);
                entry.appendChild(quantity);

                list.appendChild(entry);
            }
            paintMap();



        }

    };
    var params = "siteId="  + getSiteId();
    xhr.send(params);
}


$(document).ready(function() {
    var siteId = getSiteId();
    ctx = document.getElementById("myChart").getContext('2d');
    es.addEventListener('NewVisit/' + siteId, function (event) {
        var data = event.data;
        var number = parseInt(document.getElementById("numVisits").innerText.split(": ")[1]);
        document.getElementById("numVisits").innerText = "Number of Visits: "+ (number+1);
    });

    es.addEventListener('FirstVisit/' + siteId, function (event) {
        var data = event.data;
        var number = parseInt(document.getElementById("numVisits").innerText.split(": ")[1]);
        document.getElementById("numFirstVisits").innerText = "First Visits: "+ (number+1);
    });

    myChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [0],
            datasets: [{
                label: '# of Visitors',
                data: [0],

            }]
        },
        options: {
            scales: {
                yAxes: [{
                    ticks: {
                        beginAtZero:true
                    }
                }]
            }
        }
    });
    getCountryList();
    draw();
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


function draw() {

    ctx = document.getElementById("myChart").getContext('2d');
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',"/dashboard/graph",true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";
    var hours , visits;
    xhr.onload = function (e) {
        var data = xhr.response;
        hours = data.map(x => x.timer);
        visits = data.map(x => x.f0_);
        var map = new Map();
        for(var i = 0 ; i < hours.length ; i++)
            map.set(hours[i] , visits[i]);
        var now = new Date().getHours();
        var labels = new Array(24);
        var data = new Array(24);
        for(var i = 23 ; i >= 0 ; i--)
        {
            var str;
            if(now < 10)
                str = '0' +now +":00";
            else
                str = now + ":00";
            labels[i] = str;

            if(!map.get(now))
            {
                data[i] = 0;
            }
            else
            {
                data[i] = map.get(now);
            }

            now = ((now - 1) + 24) % 24;

        }

        myChart.data.labels = labels;
        myChart.data.datasets[0].data = data;
        myChart.update();
    }


    var params = "siteId="  + getSiteId();
    xhr.send(params);



}