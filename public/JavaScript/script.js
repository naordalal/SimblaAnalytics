

var xhr = new XMLHttpRequest();
xhr.withCredentials = true;
xhr.open('POST',"http://192.168.0.102:3000/visit",true); //TODO : Change URL.
xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
var elements = document.getElementsByName("page-source");
var siteId = null;
for (var i = 0; i < elements.length; ++i)
{
    var elem = elements[i];http://localhost:8080
    if(elem.tagName == 'META')
    {
        siteId = elem.getAttribute("site-id");
        break;
    }
}

if(siteId != null)
{
    var params = "siteId=" + siteId;
    xhr.send(params);
}