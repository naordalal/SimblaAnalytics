

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


$(window).load(function(){
    var height = window.innerHeight,
        x= 0, y= height/2,
        curveX = 40,
        curveY = window.screen.height/2,
        targetX = 0,
        xitteration = 0,
        yitteration = 0,
        menuExpanded = false;

    blob = $('#blob'),
        blobPath = $('#blob-path'),

        hamburger = $('.hamburger');

    $(this).on('mousemove', function(e){
        x = e.pageX;

        y = e.pageY;
    });

    $('.hamburger, .menu-inner').on('mouseenter', function(){
        $(this).parent().addClass('expanded');
        menuExpanded = true;
    });

    $('.menu-inner').on('mouseleave', function(){
        menuExpanded = false;
        $(this).parent().removeClass('expanded');
    });

    function easeOutExpo(currentIteration, startValue, changeInValue, totalIterations) {
        return changeInValue * (-Math.pow(2, -10 * currentIteration / totalIterations) + 1) + startValue;
    }

    var hoverZone = 150;
    var expandAmount = 20;

    function svgCurve() {
        if ((curveX > x-1) && (curveX < x+1)) {
            xitteration = 0;
        } else {
            if (menuExpanded) {
                targetX = 0;
            } else {
                xitteration = 0;
                if (x > hoverZone) {
                    targetX = 0;
                } else {
                    targetX = -(((60+expandAmount)/100)*(x-hoverZone));
                }
            }
            xitteration++;
        }

        if ((curveY > y-1) && (curveY < y+1)) {
            yitteration = 0;
        } else {
            yitteration = 0;
            yitteration++;
        }

        var anchorDistance = 200;
        var curviness = anchorDistance - 40;

        var newCurve2 = "M60,"+height+"H0V0h60v"+(curveY-anchorDistance)+"c0,"+curviness+","+curveX+","+curviness+","+curveX+","+anchorDistance+"S60,"+(curveY)+",60,"+(curveY+(anchorDistance*2))+"V"+height+"z";

        blobPath.attr('d', newCurve2);

        blob.width(curveX+60);

        hamburger.css('transform', 'translate('+curveX+'px, '+curveY+'px)');

        $('h2').css('transform', 'translateY('+curveY+'px)');
        window.requestAnimationFrame(svgCurve);
    }

    window.requestAnimationFrame(svgCurve);


    var siteId = getSiteId();
    //ctx = document.getElementById("myChart").getContext('2d');
    //pieCtx = document.getElementById("pieChart").getContext('2d');
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

    /*myChart = new Chart(ctx, {
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
    });*/
    getCountryList();

    google.charts.load('current', {'packages':['corechart']});
    google.charts.setOnLoadCallback(drawPieChart);

    google.charts.load('current', {'packages':['table']});
    google.charts.setOnLoadCallback(getRefererList );

    google.charts.load('current', {'packages':['line']});
    google.charts.setOnLoadCallback(drawLineChart);
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
            },
            backgroundColor:'transparent',
            titleTextStyle:{ fontSize : 15, color: "#e6e6e8"}
        };

        var chart = new google.charts.Line(document.getElementById('linechart_material'));

        chart.draw(dataTable, google.charts.Line.convertOptions(options));
    }
    var params = "siteId=" + getSiteId();
    xhr.send(params);
}


function drawPieChart() {
        var options = {
            title: 'OS Distribution',
            backgroundColor:"transparent",
            legend :{ alignment:'center', textStyle: {fontSize : 12, color: "#e6e6e8"}},
            titleTextStyle:{ fontSize : 15, color: "#e6e6e8"},
            chartArea:{width:'100%',height:'75%'}
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

            var chart = new google.visualization.PieChart(document.getElementById('piechart'));
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
    var data = new google.visualization.DataTable();
    data.addColumn('string','Referrer');
    data.addColumn('number','Visits');
    xhr.onload = function (e)
    {
        var list = xhr.response;
        data.addRows(list.map(x => [x.Referr, x.visits]));

        var table = new google.visualization.Table(document.getElementById('Referr_table_div'));
        table.draw(data, {width: '100%', height: '100%'});
    }

    var params = "siteId=" + getSiteId();
    xhr.send(params);
}


function MenuItemClicked(but) {
    if(but.value == 0) {
        but.style.color = "#87CEEB";
        but.value = 1;
    }
    else {
        but.style.color = "#000000";
        but.value = 0;
    }
}

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

