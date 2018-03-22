

var es = new EventSource('/visitEvent');
var countryMap = new Map();
var myChart;
var pieChart;
var ctx;
var pieCtx;
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


                var entry = document.createElement('tr');
                var countryTd = document.createElement('td');
                var flagTd = document.createElement('td');
                var visitorsTd = document.createElement('td');

                var country = document.createTextNode(countryList[i].Country);
                countryTd.appendChild(country);

                var flag = document.createElement('img');
                flagTd.appendChild(flag);
                flag.setAttribute("src", "https://raw.githubusercontent.com/hjnilsson/country-flags/master/png100px/il.png")
                var quantity = document.createTextNode(countryList[i].visits);
                visitorsTd.appendChild(quantity)

                flag.setAttribute("class", "flag");

                entry.appendChild(countryTd);
                entry.appendChild(flagTd);
                entry.appendChild(visitorsTd);

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
    pieCtx = document.getElementById("pieChart").getContext('2d');
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
                borderColor : "#e6e6e8",
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

    pieChart =  new Chart(pieCtx,{
        type: 'pie',
        data: {
            labels: [0],
            datasets: [{
                label: "OS distribution",
                data: [0]
            }]
        }
    });
    getCountryList();
    drawLineChart();
    drawPieChart();
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


function drawLineChart() {

    ctx = document.getElementById("myChart").getContext('2d');
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST', "/dashboard/graph", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";
    var hours, visits;
    xhr.onload = function (e) {
        var data = xhr.response;
        hours = data.map(x => x.timer);
        visits = data.map(x => x.f0_);
        var map = new Map();
        for (var i = 0; i < hours.length; i++)
            map.set(hours[i], visits[i]);
        var now = new Date().getHours();
        var labels = new Array(24);
        var data = new Array(24);
        for (var i = 23; i >= 0; i--) {
            var str;
            if (now < 10)
                str = '0' + now + ":00";
            else
                str = now + ":00";
            labels[i] = str;

            if (!map.get(now)) {
                data[i] = 0;
            }
            else {
                data[i] = map.get(now);
            }

            now = ((now - 1) + 24) % 24;

        }

        myChart.data.labels = labels;
        myChart.data.datasets[0].data = data;
        myChart.update();
    }
    var params = "siteId=" + getSiteId();
    xhr.send(params);
}


function drawPieChart() {

    //ctx = document.getElementById("pieChart").getContext('2d');
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST', "/dashboard/pieChart", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";

    xhr.onload = function (e) {
        var data = xhr.response;
        console.log(data)
        if(data!=null) {
            var labels = new Array(data.length);
            var visits = new Array(data.length);
            var colors = new Array(data.length);

            for (var i = 0; i < data.length; i++) {
                labels[i] = data[i].Os;
                visits[i] = data[i].visits;
            }
            colors[0]='red';
            colors[1]='yellow';
            pieChart.data.labels = labels;
            pieChart.data.datasets[0].data = visits;
            pieChart.data.datasets[0].backgroundColor = colors;
            pieChart.update();
        }
    }
    var params = "siteId=" + getSiteId();
    xhr.send(params);
}


//Menu

function w3_open() {
    document.getElementById("main").style.marginLeft = "25%";
    document.getElementById("mySidebar").style.width = "25%";
    document.getElementById("mySidebar").style.display = "block";
    document.getElementById("openNav").style.display = 'none';
}
function w3_close() {
    document.getElementById("main").style.marginLeft = "0%";
    document.getElementById("mySidebar").style.display = "none";
    document.getElementById("openNav").style.display = "inline-block";
}

