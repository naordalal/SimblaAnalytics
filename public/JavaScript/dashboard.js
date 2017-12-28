

var es = new EventSource('/visitEvent');
var countryList;

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
    xhr.onreadystatechange = function(next) {
        if (xhr.readyState === 4)
        {
            countryList = JSON.parse(xhr.response);
            var list = document.getElementById('countries');
            var i;
            for (i=0 ; i<countryList.length;i++) //Add the list to the view.
            {
                var entry = document.createElement('li');
                entry.appendChild(document.createTextNode(countryList[i].name + ":" + countryList[i].phone));
                list.appendChild(entry);
            }
        }
    };
    xhr.send();
}