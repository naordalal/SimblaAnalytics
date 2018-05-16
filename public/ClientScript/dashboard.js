

var es = new EventSource('/visitEvent');
var countryMap = new Map();
var gdpData = {};
var paintMap = function () {
    console.log("empty Function ... look at map.js")
}

google.charts.load('current', {'packages':['line','corechart','table','treemap','controls']});
google.charts.setOnLoadCallback(drawLineChart);
google.charts.setOnLoadCallback(drawPieChart);
google.charts.setOnLoadCallback(getRefererList);
google.charts.setOnLoadCallback(getPageViews);
google.charts.setOnLoadCallback(getCountryList);
google.charts.setOnLoadCallback(getScrolling);
google.charts.setOnLoadCallback(getCampaigns);
google.charts.setOnLoadCallback(getHourOfTheDay);



//The side menu
$(window).load(function(){

    var siteId = getSiteId();

    es.addEventListener('NewVisit/' + siteId, function (event) {
        var number = parseInt(document.querySelectorAll('.totalVisits .value')[0].innerText);
        document.querySelectorAll('.totalVisits .value')[0].innerText = (number+1);
    });

    es.addEventListener('FirstVisit/' + siteId, function (event) {
        var number = parseInt(document.querySelectorAll('.totalFirstVisits .value')[0].innerText);
        document.querySelectorAll('.totalFirstVisits .value')[0].innerText = (number+1);
    });
});

//Get the visited countries
//Used for the worldMap and the countries table.
function getCountryList()
{

    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',"/dashboard/countryList",true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";
    xhr.onload =function(next) {

        //response is ready
        if(xhr.readyState==4) {
            var countryList = xhr.response;
           // var list = document.getElementById('countries');
            var i;

            var data = []
            data.push(['Country','Visits'])
            data = data.concat(countryList.map(x => [x.Country, x.visits]));

            data = google.visualization.arrayToDataTable(data);

            var view = new google.visualization.DataView(data);

            var options = {
                title: "Country List",
                legend : {position: 'none'}
            };
            var chart = new google.visualization.BarChart(document.getElementById("countryList"));
            chart.draw(view, options);
            //Build the countries table.
            for (i = 0; i < countryList.length; i++) //Add the list to the view.
            {

                countryMap.set(countryList[i].Country.toUpperCase(), countryList[i].visits);
                gdpData[getCountryCode(countryList[i].Country).toLowerCase()] = countryList[i].visits;
            }
            //Paint the map.
            paintMap();
        }
    };
    var params = "siteId="  + getSiteId();

    xhr.send(params);
}




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

function getScrolling() {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST', "/dashboard/scrolling", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";
    xhr.onload = function (e) {
        var resp = xhr.response;
        var data = []
        data.push(['Page','Percentage']);
        data = data.concat(resp.map(x=> [x.PageID, x.scroll]));
        data= google.visualization.arrayToDataTable(data);


        var view = new google.visualization.DataView(data);

        var options= {
            title: "Scrolling Percentage",
            legend: { position: "none" },
            vAxis: {direction: -1}

        }

        var chart = new google.visualization.ColumnChart(document.getElementById("columnchart_values"));
        chart.draw(view, options);
    }
    var params = "siteId=" + getSiteId();
    xhr.send(params);
}


function drawLineChart() {

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
                data[i] = [labels[i],0];
            }
            else {
                data[i] = [labels[i],map.get(now)];
            }

            now = ((now - 1) + 24) % 24;

        }

        var dataTable = new google.visualization.DataTable();
        dataTable.addColumn('string', 'Hour');
        dataTable.addColumn('number', '');
        dataTable.addRows(data);
        var options = {
            chart: {
                title: 'Visits per hour',
                titleTextStyle : {bold : true}
            },
            backgroundColor:'transparent',
            titleTextStyle:{ fontSize : 15, color: "black"}

        };

        var chart = new google.charts.Line(document.getElementById('chart_div'));

        chart.draw(dataTable, google.charts.Line.convertOptions(options));
    }
    var params = "siteId=" + getSiteId();
    xhr.send(params);
}


function drawPieChart() {
        var options = {
            title: 'OS Distribution',
            backgroundColor:"transparent",
            legend :{ alignment:'center', textStyle: {fontSize : 12, color: "black"}},
            titleTextStyle:{ fontSize : 15, color: "black"},
            chartArea:{width:'100%',height:'75%'},
            pieHole: 0.4
        };


        var xhr = new XMLHttpRequest();
        xhr.withCredentials = true;
        xhr.open('POST', "/dashboard/pieChart", true);
        xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhr.responseType = "json";

        xhr.onload = function (e) {
            var data = xhr.response;

            data = data.filter(x => x.Os);
            if(data!=null)
             {
              data = data.map(x => [x.Os , x.visits]);
             }
            data.unshift(['OS','Visits']);
             var readyData = google.visualization.arrayToDataTable(data);


            var chart = new google.visualization.PieChart(document.getElementById('donutchart'));
            chart.draw(readyData, options);
        }

        var params = "siteId=" + getSiteId();
        xhr.send(params);
}


function getRefererList()
{
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',"/dashboard/ReferrList",true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";

    xhr.onload = function (e)
    {
        var list = xhr.response;

        var data = []
        data.push(['Referr','Visits'])
        data = data.concat(list.map(x => [x.Referr, x.visits]));
        data = google.visualization.arrayToDataTable(data);

        var view = new google.visualization.DataView(data);

        var options = {
            title: "Referrers",
            legend : {position: 'none'}
        };
        var chart = new google.visualization.BarChart(document.getElementById("referres_barchart"));
        chart.draw(view, options);

    }

    var params = "siteId=" + getSiteId();
    xhr.send(params);
}

function getPageViews()
{
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',"/dashboard/pageViews",true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";

    xhr.onload = function (e)
    {
        var list = xhr.response;

        var list = xhr.response;

        var data = []
        data.push(['Page','Visits'])
        data = data.concat(list.map(x => [x.PageID, x.popularity]));
        data = google.visualization.arrayToDataTable(data);

        var view = new google.visualization.DataView(data);

        var options = {
            title: "Page visits",
            legend : {position: 'none'}
        };
        var chart = new google.visualization.BarChart(document.getElementById("pageViewsChart"));
        chart.draw(view, options);
    }

    var params = "siteId=" + getSiteId();
    xhr.send(params);
}

function getHeatmap()
{
    window.open('heatmap?siteId='+getSiteId());
}

var tree_table;
function getCampaigns()
{
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST', "/dashboard/Campaigns", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";
    xhr.onload = function (e)
    {

        var data = [['Label1','Label2','Visits']];
        data = data.concat(xhr.response);

        data = google.visualization.arrayToDataTable(data);


        var tree = new google.visualization.TreeMap(document.getElementById('inner_campaigns'));
        tree.draw(data, {
            minColor: '#8da7be',
            midColor: '#fcfffa',
            maxColor: '#494842',
            headerHeight: 15,
            fontColor: 'black',
            title : 'Campaigns',
            generateTooltip: showFullTooltip,
            highlightOnMouseOver: true,
        });
        
        
        function showFullTooltip (row, size,value) {
            return '<div style="background:#fcfffa; padding:10px;">' +
            'Visits : '+data.getValue(row,2)+'</div>';
        }


        tree_table = tree;

    }
    var params = "siteId=" + getSiteId();
    xhr.send(params);
}

var hourOfTheDayData;
function getHourOfTheDay()
{
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST', "/dashboard/houroftheday", true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";
    xhr.onload = function (e)
    {
        hourOfTheDayData = xhr.response;

        var today = new Date().getDay()+1;
        drawHourOfTheDayChartByDay(today);

    }

    var params = "siteId=" + getSiteId();
    xhr.send(params);
}


function drawHourOfTheDayChartByDay(day)
{
    var data = hoursByDay(hourOfTheDayData , day);
    console.log(data);
    data = google.visualization.arrayToDataTable(data);
    var view = new google.visualization.DataView(data);

    day = getDayName(day);
    var colChart = new google.visualization.ColumnChart(document.getElementById("hourOfTheDayChart"));
    console.log(day)
    colChart.draw(view,{
        title: day,
        legend : {position: 'none'},
        hAxis: {ticks : [0,3,6,9,12,15,18,21,24]}

    });
}

function hoursByDay(data,day)
{
    var resData = [['Hour','Visits']];
    resData = resData.concat(hourOfTheDayData.map(x =>  {if (x.day == day) return [x.hour,x.visits]}));
    resData = resData.filter(x => x!=undefined);

    return resData;
}


function getDayName(day)
{
    var name;
    switch(day)
    {

        case 1:
            name = "Sunday";
            break;
        case 2:
            name = "Monday";
            break;
        case 3:
            name = "Tuesday";
            break;
        case 4:
            name = "Wednesday";
            break;
        case 5:
            name = "Thursday";
            break;
        case 6:
            name = "Friday";
            break;
        case 7:
            name = "Saturday";
            break;
        default:
            name = "";
    }
    return name;
}



