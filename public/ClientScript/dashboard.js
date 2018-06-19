

var es = new EventSource('/visitEvent');
var countryMap = new Map();
var gdpData = {};
var paintMap = function () {
    console.log("empty Function ... look at map.js")
}

//Google charts packages.
google.charts.load('current', {'packages':['line','corechart','table','treemap','controls']});
//Callbacks for drawing the graphs.
google.charts.setOnLoadCallback(drawLineChart);
google.charts.setOnLoadCallback(drawPieChart);
google.charts.setOnLoadCallback(getRefererList);
google.charts.setOnLoadCallback(getPageViews);
google.charts.setOnLoadCallback(getCountryList);
google.charts.setOnLoadCallback(getScrolling);
google.charts.setOnLoadCallback(getCampaigns);
google.charts.setOnLoadCallback(getHourOfTheDay);



$(window).load(function(){

    $('.counters').each(function () {
        $(this).prop('Counter',0).animate({
            Counter: $(this).text()
        }, {
            duration: 3000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now));
            }
        });
    });

    $('.rate').each(function () {
        $(this).prop('Counter',0).animate({
            Counter: $(this).text()
        }, {
            duration: 3000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now) + "%");
            }
        });
    });

    $('.time').each(function () {
        $(this).prop('Counter',0).animate({
            Counter: $(this).text()
        }, {
            duration: 3000,
            easing: 'swing',
            step: function (now) {
                $(this).text(Math.ceil(now) + " ms");
            }
        });
    });

    var siteId = getSiteId();
//Subscribe to the event of visit (SSE).
    es.addEventListener('NewVisit/' + siteId, function (event) {
        var number = parseInt(document.querySelectorAll('.totalVisits .value')[0].innerText);
        document.querySelectorAll('.totalVisits .value')[0].innerText = (number+1);
    });
//Subscribe to the event of first visit (SSE).
    es.addEventListener('FirstVisit/' + siteId, function (event) {
        var number = parseInt(document.querySelectorAll('.totalFirstVisits .value')[0].innerText);
        document.querySelectorAll('.totalFirstVisits .value')[0].innerText = (number+1);
    });
});

//Return the site-id that the server put inside the metadata of the site.
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

/**Generic method to send http request.
Parameters :
 path  : the path to call.
 onloadCallback_wraper : function that wrap the callback method.
    We wrapped the callback because the callback functions use the xhr object to get the response,
    so we need to pass for every callback the appropriate instance of the request.
 params : the parameters to send inside the request body.
 method : GET or POST. The default is POST.
 **/
function sendHttpRequest(path,onloadCallback_wraper,params,method='POST')
{
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open(method,path,true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";
    xhr.onload = onloadCallback_wraper(xhr);
    xhr.send(params);

}

function getClassByChoice(choice)
{
    return ["day","week","month","year"][choice];
}

function markOptionAsSelected(chart , ele_class)
{
    ["day","week","month","year"].forEach((c ,index) =>{
        //var element = document.querySelector("."+chart+" ."+c);
        $("."+chart+" ."+c).removeClass("selected")
       // element.classList.remove("selected");
    });
    $("."+chart+" ."+ele_class).addClass("selected");
}

//Get the visited countries
//Used for the worldMap and the countries table.
function getCountryList(choice = 3)
{
    var chart_div = "countryList-div";

    var path = "/dashboard/countryList";
    var callbackWraper = function (xhr)
    {
        return function(next) {
            //response is ready
            if(xhr.readyState==4) {
                var countryList = xhr.response;

                // var list = document.getElementById('countries');
                var i;

                var data = []
                data.push(['Country','Visits'])
                data = data.concat(countryList.slice(0,5).map(x => [x.Country, x.visits]));

                if(data.length == 1)
                    data.push(['',0]);

                data = google.visualization.arrayToDataTable(data);

                var view = new google.visualization.DataView(data);

                var options = {
                    title: "Country List",
                    legend : {position: 'none'}
                };
                var chart = new google.visualization.BarChart(document.getElementById("countryList"));
                chart.draw(view, options);
                //Build the countries table.

                countryMap = new Map();
                gdpData = {};
                for (i = 0; i < countryList.length; i++) //Add the list to the view.
                {
                    if(!countryList[i].Country)
                        continue;

                    countryMap.set(countryList[i].Country.toUpperCase(), countryList[i].visits);
                    gdpData[getCountryCode(countryList[i].Country).toLowerCase()] = countryList[i].visits;
                }
                //Paint the map.
                paintMap();
            }
        };
    };

    var params = "siteId=" + getSiteId() + "&time=" + getDaysFromChoice(choice);
    sendHttpRequest(path,callbackWraper,params);
    markOptionAsSelected(chart_div,getClassByChoice(choice));
}



function getScrolling(choice = 3)
{

    var chart_div = "scrolling_chart-div";

    var path =  "/dashboard/scrolling";

    var wraper =function(xhr) {
        return function (e) {
            var resp = xhr.response;
            var data = []
            data.push(['Page', 'Percentage']);
            data = data.concat(resp.map(x => [x.PageID, x.scroll]));
            if(data.length == 1)
                data.push(['',0]);
            data = google.visualization.arrayToDataTable(data);


            var view = new google.visualization.DataView(data);

            var options = {
                title: "Scrolling Percentage",
                legend: {position: "none"},
                vAxis: {direction: -1}

            }

            var chart = new google.visualization.ColumnChart(document.getElementById("scrolling_chart"));
            chart.draw(view, options);
        };
    };

    var params = "siteId=" + getSiteId() + "&time=" + getDaysFromChoice(choice);
    sendHttpRequest(path,wraper,params);
    markOptionAsSelected(chart_div,getClassByChoice(choice));
}


function drawLineChart() {

    var path = "/dashboard/graph";
    var wraper = function(xhr)
    {
        return function (e) {
            var data = xhr.response;
            var hours = data.map(x => x.timer);
            var visits = data.map(x => x.f0_);
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
        };
    };
    var params = "siteId=" + getSiteId();
    sendHttpRequest(path,wraper,params);
}


function drawPieChart(choice = 3) {


    var chart_div = "donutchart-div";

    var path = "/dashboard/pieChart";
    var wraper = function (xhr) {
        return function (e)
        {
            var data = xhr.response;
            data = data.filter(x => x.Os);
            if(data!=null)
            {
                data = data.map(x => [x.Os , x.visits]);
            }
            data.unshift(['OS','Visits']);
            var readyData = google.visualization.arrayToDataTable(data);

            var options = {
                title: 'OS Distribution',
                backgroundColor:"transparent",
                legend :{ alignment:'center', textStyle: {fontSize : 12, color: "black"}},
                titleTextStyle:{ fontSize : 15, color: "black"},
                chartArea:{width:'100%',height:'75%'},
                pieHole: 0.4
            };

            var chart = new google.visualization.PieChart(document.getElementById('donutchart'));
            chart.draw(readyData, options);
        };
    };

    var params = "siteId=" + getSiteId() + "&time=" + getDaysFromChoice(choice);
    sendHttpRequest(path,wraper,params);
    markOptionAsSelected(chart_div,getClassByChoice(choice));
}


function getRefererList(choice = 3)
{

    var chart_div = "referres-div";

    var path = "/dashboard/ReferrList";
    var wraper  = function (xhr)
    {
        return function (e)
        {
            var list = xhr.response;

            var data = []
            data.push(['Referr','Visits'])
            data = data.concat(list.map(x => [x.Referr, x.visits]));
            if(data.length == 1)
                data.push(['',0]);
            data = google.visualization.arrayToDataTable(data);

            var view = new google.visualization.DataView(data);

            var options = {
                title: "Referrers",
                legend : {position: 'none'}
            };
            var chart = new google.visualization.BarChart(document.getElementById("referres_barchart"));
            chart.draw(view, options);

        };
    };

    var params = "siteId=" + getSiteId() + "&time=" + getDaysFromChoice(choice);
    sendHttpRequest(path,wraper,params);
    markOptionAsSelected(chart_div,getClassByChoice(choice));
}

function getDaysFromChoice(choice) {
    var days = [1,7,30,356];
    return days[choice];
}

function getPageViews(choice = 3)
{

    var chart_div = "pageViewsChart-div";

    var path = "/dashboard/pageViews";
    var wraper = function (xhr)
    {
        return function (e)
        {
            var list = xhr.response;
            var data = []
            data.push(['Page','Visits'])
            data = data.concat(list.map(x => [x.PageID, x.popularity]));
            if(data.length == 1)
                data.push(['',0]);
            pushPagesToHeatmapListDOM(data);
            data = google.visualization.arrayToDataTable(data.slice(0,6));

            var view = new google.visualization.DataView(data);

            var options = {
                title: "Page visits",
                legend : {position: 'none'}
            };
            var chart = new google.visualization.BarChart(document.getElementById("pageViewsChart"));
            chart.draw(view, options);
        }
    };

    var params = "siteId=" + getSiteId() + "&time=" + getDaysFromChoice(choice);
    sendHttpRequest(path,wraper,params);
    markOptionAsSelected(chart_div,getClassByChoice(choice));
}

function pushPagesToHeatmapListDOM(data)
{
    data = data.slice(1);
    data = data.sort(function(a,b) {
        return (""+a[0]).localeCompare(b[0]);
    });
    let DOMList = document.querySelector('.heatmap-content');
    for(var i =1 ; i<data.length; i++)
    {
        let span = document.createElement('span');
        let page = data[i][0];
        span.innerHTML = page;
        span.onclick = function() {getHeatmap(''+page);};
        DOMList.appendChild(span);
    }
}
function getHeatmap(page)
{
    window.open('heatmap?siteId='+getSiteId()+'&page='+page);
}

var tree_table;
function getCampaigns()
{
    var path  = "/dashboard/Campaigns";
    var wraper = function (xhr)
    {
        return function (e)
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

        };
    };


    var params = "siteId=" + getSiteId();
    sendHttpRequest(path,wraper,params);
}

var hourOfTheDayData;
function getHourOfTheDay()
{
    var path  = "/dashboard/houroftheday";
    var wraper = function(xhr)
    {
        return function (e)
        {
            hourOfTheDayData = xhr.response;
            var today = new Date().getDay()+1;
            drawHourOfTheDayChartByDay(today);
        }
    }

    var params = "siteId=" + getSiteId();
    sendHttpRequest(path,wraper,params);
}


function drawHourOfTheDayChartByDay(day)
{
    var data = hoursByDay(hourOfTheDayData , day);
    data = google.visualization.arrayToDataTable(data);
    var view = new google.visualization.DataView(data);

    day = getDayName(day);
    var colChart = new google.visualization.ColumnChart(document.getElementById("hourOfTheDayChart"));
    colChart.draw(view,{
        title : day,
        legend : {position: 'none'},
        bar: {groupWidth: "95%"},
        hAxis: {ticks : [0,3,6,9,12,15,18,21,24]},

    });
}

function hoursByDay(data,day)
{
    var resData = [['Hour','Visits']];
    var sum = hourOfTheDayData.filter(x =>x.day == day ).reduce((x,y)=> x+y.visits ,0);

    resData = resData.concat(hourOfTheDayData.map(x =>  {if (x.day == day) return [x.hour,x.visits/sum]}));
    resData = resData.filter(x => x!=undefined);
    var i = 0;
    loop1:
        for(;i < 24; i++) {
            for(var el in resData) {
                if (el[0] == i)
                    continue loop1;
            }
            resData.push([i,0]);
    }
    return resData;
}


function getDayName(day)
{
    if(day>7)
        return "";
    var days = ["","Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    return days[day];
}



