

var es = new EventSource('/visitEvent');
//var HashMap = require('hashmap');
var countryMap = new Map();
var myChart;
var ctx;
function getCountryList()
{
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',"/dashboard/countryList",true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";
    xhr.onreadystatechange =function(next) {

        if(xhr.readyState==4) {
            var countryList = xhr.response;
            var list = document.getElementById('countries');
            var i;
            for (i = 0; i < countryList.length; i++) //Add the list to the view.
            {
                countryMap.set(countryList[i].Country, countryList[i].visits);
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
            draw();
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
        document.getElementById("numVisits").innerText = "Number of Visits: "+ data;
    });

    es.addEventListener('FirstVisit/' + siteId, function (event) {
        var data = event.data;
        document.getElementById("numFirstVisits").innerText = "First Visits: "+ data;
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
    getCountryList()

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
        hours = data.map(x => x.timer+":00");
        visits = data.map(x => x.f0_);
        myChart.data.labels = hours
        myChart.data.datasets[0].data = visits
        myChart.update();
     /*   myChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: hours,
                datasets: [{
                    label: '# of Visitors',
                    data: visits,

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
        }); */
    }


    var params = "siteId="  + getSiteId();
    xhr.send(params);



}