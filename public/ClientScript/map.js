
jQuery(document).ready(function() {
    jQuery('#vmap').vectorMap({ map: 'world_en' });

    jQuery('#vmap').bind('labelShow.jqvmap',
        function(event, label, code)
        {
            event.preventDefault();
            var xhr = new XMLHttpRequest();
            xhr.withCredentials = true;
            xhr.open('POST',"/visit/getVisitsCount",true); //TODO : Change URL.
            xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
            xhr.responseType = "json";
            xhr.onload = function(e) {
                var countryCount = xhr.response;
                label.text(countryCount.name + " -  " + countryCount.count);
                label.show();
            }

            var params = "countryCode=" + code;
            xhr.send(params);

        }
    );
});