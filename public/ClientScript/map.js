
jQuery(document).ready(function() {
    jQuery('#vmap').vectorMap({ map: 'world_en' });
    $('#vmap').css('background-color', 'transparent');
    jQuery('#vmap').bind('labelShow.jqvmap',
        function(event, label, code)
        {
            var countryName = getCountryName(code.toUpperCase());
            var countryVisits = countryMap.get(countryName.toUpperCase());
            if(countryVisits == undefined)
                countryVisits = 0;
            label.text(countryName + " -  " +countryVisits);
            label.show()

        }

    );


    paintMap  =  function()
    {
        var sum = 0,
        cc,
        colors = {};
        //find maximum and minimum values
        for (cc in gdpData)
        {
            sum += parseFloat(gdpData[cc]);

        }

        //set colors according to values of GDP
        for (cc in gdpData)
        {
            colors[cc] = shade('#FF0000' ,1 - (parseFloat(gdpData[cc]))/sum);

        }

        jQuery('#vmap').vectorMap('set', 'colors' , colors)
    }

});

function shadeColor2(color, percent) {
    var f=parseInt(color.slice(1),16),t=percent<0?0:255,p=percent<0?percent*-1:percent,R=f>>16,G=f>>8&0x00FF,B=f&0x0000FF;
    return "#"+(0x1000000+(Math.round((t-R)*p)+R)*0x10000+(Math.round((t-G)*p)+G)*0x100+(Math.round((t-B)*p)+B)).toString(16).slice(1);
}

function shade(color, percent){
    if (color.length > 7 ) return shadeRGBColor(color,percent);
    else return shadeColor2(color,percent);
}


