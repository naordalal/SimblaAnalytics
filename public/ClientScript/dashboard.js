

var es = new EventSource('/visitEvent');
var countryMap = new Map();
var gdpData = {};
var paintMap = function () {
    console.log("empty Function ... look at map.js")
}

google.charts.load('current', {'packages':['line']});
google.charts.setOnLoadCallback(drawLineChart);

google.charts.load('current', {'packages':['corechart']});
google.charts.setOnLoadCallback(drawPieChart);

google.charts.load('current', {'packages':['table']});
google.charts.setOnLoadCallback(getRefererList);

google.charts.setOnLoadCallback(getCountryList);
google.charts.setOnLoadCallback(getScrolling);
google.charts.load('current', {'packages':['treemap']});
google.charts.setOnLoadCallback(getCampiagns);



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
        console.log(resp);
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
            console.log(data)
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
        console.log(list)

        list.forEach(item =>
        {
            var entry = document.createElement('tr');
            var pageTd = document.createElement('td');
            var visitsTd = document.createElement('td');
            pageTd.innerText = item.PageID;
            visitsTd.innerText = item.popularity;
            entry.appendChild(pageTd);
            entry.appendChild(visitsTd);
            table.appendChild(entry);
        });

        container.appendChild(table);
    }

    var params = "siteId=" + getSiteId();
    xhr.send(params);
}

function getHeatmap()
{
    window.open('heatmap?siteId='+getSiteId());
}


function getCampiagns()
{
    var data = google.visualization.arrayToDataTable([
        ['Location', 'Parent', 'Market trade volume (size)', 'Market increase/decrease (color)'],
        ['Global',    null,                 0,                               0],
        ['America',   'Global',             0,                               0],
        ['Europe',    'Global',             0,                               0],
        ['Asia',      'Global',             0,                               0],
        ['Australia', 'Global',             0,                               0],
        ['Africa',    'Global',             0,                               0],
        ['Brazil',    'America',            11,                              10],
        ['USA',       'America',            52,                              31],
        ['Mexico',    'America',            24,                              12],
        ['Canada',    'America',            16,                              -23],
        ['France',    'Europe',             42,                              -11],
        ['Germany',   'Europe',             31,                              -2],
        ['Berlin', 'Germany' , 20 , -5],
        ['Sweden',    'Europe',             22,                              -13],
        ['Italy',     'Europe',             17,                              4],
        ['UK',        'Europe',             21,                              -5],
        ['China',     'Asia',               36,                              4],
        ['Japan',     'Asia',               20,                              -12],
        ['India',     'Asia',               40,                              63],
        ['Laos',      'Asia',               4,                               34],
        ['Mongolia',  'Asia',               1,                               -5],
        ['Israel',    'Asia',               12,                              24],
        ['Iran',      'Asia',               18,                              13],
        ['Pakistan',  'Asia',               11,                              -52],
        ['Egypt',     'Africa',             21,                              0],
        ['S. Africa', 'Africa',             30,                              43],
        ['Sudan',     'Africa',             12,                              2],
        ['Congo',     'Africa',             10,                              12],
        ['Zaire',     'Africa',             8,                               10]
    ]);

    tree = new google.visualization.TreeMap(document.getElementById('campaigns'));

    tree.draw(data, {
        minColor: '#f00',
        midColor: '#ddd',
        maxColor: '#0d0',
        headerHeight: 15,
        fontColor: 'black',
        showScale: true
    });

}



