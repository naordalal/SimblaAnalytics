window.onload =  function () {

    element = document.querySelector('.heatmapd922f01521180610c5e000ed93d40af2')
    var heatmapInstance = h337.create({
        // only container is required, the rest will be defaults
        container: element
    });

// heatmap data format
    var points = window.points;
    var max = Math.max(...points.map(p => p.value));
    var data = {
        max : max,
        data: points
    };
// if you have a set of datapoints always use setData instead of addData
// for data initialization
    heatmapInstance.setData(data);

};


