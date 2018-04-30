

var es = new EventSource('/visitEvent');
var countryMap = new Map();
var ctx;
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
            var list = document.getElementById('countries');
            var i;

            //Build the countries table.
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

                //@TODO : flag for each country.
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

            //Paint the map.
            paintMap();



        }

    };
    var params = "siteId="  + getSiteId();
    xhr.send(params);
}

//The side menu
$(window).load(function(){

    var siteId = getSiteId();
    //ctx = document.getElementById("myChart").getContext('2d');
    //pieCtx = document.getElementById("pieChart").getContext('2d');
    es.addEventListener('NewVisit/' + siteId, function (event) {

        var number = parseInt(document.querySelectorAll('.totalVisits .title')[0].innerText);
        document.querySelectorAll('.totalVisits .title')[0].innerText = (number+1);
    });

    es.addEventListener('FirstVisit/' + siteId, function (event) {

        var number = parseInt(document.querySelectorAll('.totalFirstVisits .title')[0].innerText);
        document.querySelectorAll('.totalFirstVisits .title')[0].innerText = (number+1);
    });

    //getCountryList(); When map is added.




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

    //ctx = document.getElementById("myChart").getContext('2d');
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
       // addDiv('linechart_material');
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

            //addDiv('piechart');
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
    /*var data = new google.visualization.DataTable();
    data.addColumn('string','Referrer');
    data.addColumn('number','Visits');*/
    var container = document.getElementById('graphsGrid');
    var table = document.createElement('table');
    table.setAttribute("id","Referr_table_div");
    table.setAttribute('class','grid-item');
    table.setAttribute('style',"width: 95%; height: 100%;");
    var entry = document.createElement('tr');
    var referrerTh = document.createElement('th');
    var visitsTh = document.createElement('th');

    referrerTh.innerText = "Referrer";
    visitsTh.innerText = "Visits";

    entry.appendChild(referrerTh);
    entry.appendChild(visitsTh);
    table.appendChild(entry);
    xhr.onload = function (e)
    {
        var list = xhr.response;

        var data = []
        data.push(['Referr','Visits'])
        data = data.concat(list.map(x => [x.Referr, x.visits]));
        //addDiv('Referr_table_div');
        data = google.visualization.arrayToDataTable(data);

        var view = new google.visualization.DataView(data);

        var options = {
            title: "Referrers",
            legend : {position: 'none'}
        };
        var chart = new google.visualization.BarChart(document.getElementById("barchart_values"));
        chart.draw(view, options);
        /*
        var table = new google.visualization.Table(document.getElementById('Referr_table_div'));
        table.draw(data, {width: '100%', height: '100%'});
      /*  list.forEach(item =>
        {
            var entry = document.createElement('tr');
            var referrerTd = document.createElement('td');
            var visitsTd = document.createElement('td');
            referrerTd.innerText = item.Referr;
            visitsTd.innerText = item.visits;
            entry.appendChild(referrerTd);
            entry.appendChild(visitsTd);
            table.appendChild(entry);
        });

        container.appendChild(table);*/
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
    /*var data = new google.visualization.DataTable();
    data.addColumn('string','Referrer');
    data.addColumn('number','Visits');*/
    var container = document.getElementById('graphsGrid');
    var table = document.createElement('table');
    table.setAttribute("id","pageViews");
    table.setAttribute('class','grid-item');
    table.setAttribute('style',"width: 95% ; height: 100%;");
    var entry = document.createElement('tr');
    var pageTh = document.createElement('th');
    var visitsTh = document.createElement('th');

    pageTh.innerText = "Page";
    visitsTh.innerText = "Visits";

    entry.appendChild(pageTh);
    entry.appendChild(visitsTh);
    table.appendChild(entry);
    xhr.onload = function (e)
    {
        var list = xhr.response;
        console.log(list)
        /*data.addRows(list.map(x => [x.Referr, x.visits]));
        addDiv('Referr_table_div');
        var table = new google.visualization.Table(document.getElementById('Referr_table_div'));
        table.draw(data, {width: '100%', height: '100%'});*/
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



function MenuItemClicked(but) {
    var graph = but.getAttribute("data-graph");
    if(but.value == 0) {
        but.style.textDecoration = "none";
        but.value = 1
        addGraph(graph);
    }
    else {
        but.style.textDecoration = "line-through";
        but.value = 0;
        document.getElementById(graph).remove();

    }
}

function addGraph(item)
{

    switch(item){
        case 'piechart':
            drawPieChart();
            break;
        case 'linechart_material':
            drawLineChart();
            break;
        case 'Referr_table_div':
            getRefererList();
            break;
        case 'Heatmap':
            getHeatmap();
            break;
        case 'pageViews':
            getPageViews();
            break;
        default:
            break;
    }
}

function addDiv(item)
{
    var container = document.getElementById('graphsGrid');
    var element = document.createElement('div');
    element.setAttribute('id',item);
    element.setAttribute('class','grid-item');
    element.setAttribute('style',"width: 100%; height: 100%;");
    container.appendChild(element);
}


