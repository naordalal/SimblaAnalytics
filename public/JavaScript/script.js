
$( document ).ready(function() {
    var xhr = new XMLHttpRequest();
    xhr.withCredentials = true;
    xhr.open('POST',"http://132.73.211.205:3000/visit",true); //TODO : Change URL.
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
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

    if(siteId != null)
    {
        var params = "siteId=" + siteId;
        xhr.send(params);
    }
});
