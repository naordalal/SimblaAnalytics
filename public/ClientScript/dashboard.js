

var es = new EventSource('/visitEvent');
//var HashMap = require('hashmap');
var countryMap = new Map();
$(document).ready(getCountryList);


es.addEventListener('NewVisit', function (event) {
        var data = event.data;
        document.getElementById("numVisits").innerText = "Number of Visits: "+ data;
});

es.addEventListener('FirstVisit', function (event) {
    var data = event.data;
    document.getElementById("numFirstVisits").innerText = "First Visits: "+ data;
});


function getCountryList()
{
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',"",true);
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.responseType = "json";
    xhr.onreadystatechange = function(next) {
        if (xhr.readyState === 4)
        {
            var countryList = xhr.response;
            var list = document.getElementById('countries');
            var i;
            for (i=0 ; i<countryList.length;i++) //Add the list to the view.
            {
                countryMap.set(countryList[i].name,countryList[i].phone);
                var entry = document.createElement('li');
                var country = document.createTextNode(countryList[i].name);
                var flag = document.createElement('img');
                flag.setAttribute("src","https://raw.githubusercontent.com/hjnilsson/country-flags/master/png100px/il.png")
                var quantity = document.createTextNode(countryList[i].phone);

                entry.setAttribute("class","countryEntry");
                flag.setAttribute("class","flag");

                entry.appendChild(country);
                entry.appendChild(flag);
                entry.appendChild(quantity);

                list.appendChild(entry);
            }
        }
    };
    xhr.send();
}