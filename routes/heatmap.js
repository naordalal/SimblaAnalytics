var express = require('express');
var heatmap = require('heatmap');
var router = express.Router();
var bigquery = require('../queries');




router.route('/').post(function(req, res, next) {
    var siteId = req.body.siteId;
    var X = req.body.X;
    var Y = req.body.Y;

    bigquery.insertMouseLoc(siteId,X,Y);
    res.send("newClick");
});


(function drawHeatMap()
{
    var heat = heatmap(1366,637);
    console.log('create heat')
    bigquery.getAllPointsOfSite(3).then(res)
    {
        for(point in res)
        {
            heat.addPoint(point.X,point.Y);
        }
        console.log('drawing');
        heat.draw();

        var fs = require('fs');
        fs.writeFileSync('myblob.png', heat.canvas.toBuffer());
        console.log("DONE Writing!");
    }
})();


module.exports = router;

