const datasetId = "test_dataset";


// Creates a client
const BigQuery = require('@google-cloud/bigquery');
const projectId = "simbla-analytics";
const bigquery = new BigQuery({
    projectId: projectId,
});

// Creates a new dataset
function createDataSet(datasetid) {
    bigquery
        .createDataset(datasetid)
        .then(results => {
            return true;
        })
        .catch(err => {
            return false;
        });
}


function createTable(datasetid, tableid, schema) {
    bigquery
        .dataset(datasetid)
        .createTable(tableid, schema)
        .then(results => {
            return true;
        })
        .catch(err => {
            return false;
        });
}

function insertData(tableid, data) {
    bigquery
        .dataset(datasetId)
        .table(tableid)
        .insert(data)
        .then(() => {
            console.log(`Inserted ${data.length} rows`);
            console.log(data);
        })
        .catch(err => {
            if (err && err.name === 'PartialFailureError') {
                if (err.errors && err.errors.length > 0) {
                    console.log('Insert errors:');
                    err.errors.forEach(err => console.error(err));
                }
            } else {
                console.error('ERROR:', err);
            }
        });
}

module.exports.insertMouseLoc = function (siteId, X, Y) {
    bigquery
        .dataset(datasetId)
        .table("click_heatmap")
        .insert([{SiteID: siteId, X: X, Y: Y}])
        .then(() => {
            console.log(`Inserted`);
        })
        .catch(err => {
            if (err && err.name === 'PartialFailureError') {
                if (err.errors && err.errors.length > 0) {
                    console.log('Insert errors:');
                    err.errors.forEach(err => console.error(err));
                }
            } else {
                console.error('ERROR:', err);
            }
        });
}

module.exports.insertVisit = function (siteId, siteURL, date , country, firstVisit, referr, os,loadTime) {
    bigquery
        .dataset(datasetId)
        .table("visits")
        .insert([{SiteID: siteId, SiteURL: siteURL, Time: date, Country: country, FirstVisit: firstVisit,
                           Referr: referr, Os:os ,LoadTime: loadTime}])
        .then(() => {
            console.log(`Inserted visit`);
        })
        .catch(err => {
            if (err && err.name === 'PartialFailureError') {
                if (err.errors && err.errors.length > 0) {
                    console.log('Insert errors:');
                    err.errors.forEach(err => console.error(err));
                }
            } else {
                console.error('ERROR:', err);
            }
        });
}

module.exports.insertCampaignData = function (siteId, utm_source, utm_campaign , utm_medium, utm_content, utm_term,date) {
    bigquery
        .dataset(datasetId)
        .table("Campaigns")
        .insert([{SiteID: siteId, utm_source: utm_source, utm_campaign: utm_campaign, utm_medium: utm_medium, utm_content: utm_content,
            utm_term: utm_term, Time:date}])
        .then(() => {
            console.log(`Inserted Campaign`);
        })
        .catch(err => {
            if (err && err.name === 'PartialFailureError') {
                if (err.errors && err.errors.length > 0) {
                    console.log('Insert errors:');
                    err.errors.forEach(err => console.error(err));
                }
            } else {
                console.error('ERROR:', err);
            }
        });
}

module.exports.insertPage = function (siteid, sessionid ,pageid , time) {
    bigquery
        .dataset(datasetId)
        .table("pages")
        .insert([{SiteID: siteid, SessionID: sessionid, PageID: pageid, Time: time}])
        .then(() => {
            console.log(`page change inserted`);
        })
        .catch(err => {
            if (err && err.name === 'PartialFailureError') {
                if (err.errors && err.errors.length > 0) {
                    console.log('page change insert errors:');
                    err.errors.forEach(err => console.error(err));
                }
            } else {
                console.error('ERROR:', err);
            }
        });
}

module.exports.getPagePopularity = function(siteid, time) {
    var sqlQuery = "SELECT PageID , COUNT(pageID) as popularity FROM " +
        "(SELECT PageID FROM [simbla-analytics:test_dataset.pages] " +
        "WHERE SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(Time) > (TIMESTAMP_TO_SEC(current_timestamp()) - 60*60*24*" + time + ")) " +
        "GROUP BY PageID ORDER BY popularity DESC ";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options)
}


module.exports.getVistsCountByCountry = function(siteid,time) {
    var sqlQuery = "SELECT Country, COUNT(Country) as visits " +
        "FROM [simbla-analytics:test_dataset.visits] "+
        "WHERE SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > (TIMESTAMP_TO_SEC(current_timestamp()) - 60*60*24*" + time + ") " +
        " GROUP BY Country ORDER BY visits DESC;";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getVistsFromSpecificCountry = function(siteid, country) {
    var sqlQuery = "SELECT COUNT(Country) as visits " +
        "FROM test_dataset.visits " +
        "WHERE SiteID = '" + siteid + "' && Country = '" + country + "';";

    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    return runQuery(options)
}

module.exports.getSessionCount = function(siteid) {
    var sqlQuery =
        "SELECT SessionID, COUNT(*) as count " +
        "FROM [simbla-analytics:test_dataset.pages] " +
        "WHERE SiteID = '" + siteid + "' " +
        "GROUP BY SessionID ";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };


    return runQuery(options);
}

module.exports.getYesterdaySessionCount = function(siteid) {
    var nowTime = new Date().toLocaleString();
    var sqlQuery =
        "SELECT SessionID, COUNT(*) as count " +
        "FROM [simbla-analytics:test_dataset.pages] " +
        "WHERE SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) < TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24 " +
        "GROUP BY SessionID ";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };


    return runQuery(options);
}

module.exports.getVisitsInTheLast24Hours = function(siteid) {
    var nowTime = new Date().toLocaleString();
    var sqlQuery = "SELECT HOUR(TIMESTAMP(Time)) as timer , COUNT(*) " +
                   "FROM (SELECT Time FROM [simbla-analytics:test_dataset.visits] " +
                          "WHERE  SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24) " +
                   "GROUP BY timer ORDER BY timer" ;
    const options = {
        query: sqlQuery,
        useQueryCache : false,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getVisitsByDays = function (siteid) {
    var sqlQuery = "SELECT DAYOFWEEK(TIMESTAMP(Time)) as day , COUNT(*) as visits " +
        "FROM (SELECT Time FROM [simbla-analytics:test_dataset.visits] " +
        "WHERE  SiteID = '" + siteid + "') " + //TODO: Add the option to select time.
        "GROUP BY day ORDER BY day" ;
    const options = {
        query: sqlQuery,
        useQueryCache : false,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getVisitsByHourOfTheDay = function (siteid , option) {

    var sqlQuery;
    if (option == 1 )
    {
        sqlQuery = "SELECT DAYOFWEEK(TIMESTAMP(Time)) AS day,\n" +
            "  HOUR(TIMESTAMP(Time)) AS hour,\n" +
            "  COUNT(*) as visits " +
            "FROM (SELECT Time FROM [simbla-analytics:test_dataset.visits] " +
            "WHERE  SiteID = '" + siteid + "') " + //TODO: Add the option to select time.
            "GROUP BY day,hour ORDER BY day,hour";
    }else
        sqlQuery ="SELECT\n" +
        "  day1 AS day,\n" +
        "  hour1 AS hour,\n" +
        "  visits1*visits2 AS visits\n" +
        "FROM (\n" +
        "  SELECT\n" +
        "    DAYOFWEEK(TIMESTAMP(Time)) AS day1,\n" +
        "    HOUR(TIMESTAMP(Time)) AS hour1,\n" +
        "    COUNT(*) AS visits1\n" +
        "  FROM\n" +
        "    [simbla-analytics:test_dataset.visits]\n" +
        "  WHERE\n" +
        "    SiteID ='"+siteid+"'\n" +
        "  GROUP BY\n" +
        "    day1,\n" +
        "    hour1) AS T1\n" +
        "JOIN (\n" +
        "  SELECT\n" +
        "    DAYOFWEEK(date) AS day2,\n" +
        "    hourDate,\n" +
        "    COUNT(date) AS visits2\n" +
        "  FROM (\n" +
        "    SELECT\n" +
        "      HOUR(TIMESTAMP(TIME)) AS hourDate,\n" +
        "      DATE(Time) AS date\n" +
        "    FROM\n" +
        "      [simbla-analytics:test_dataset.visits]\n" +
        "    WHERE\n" +
        "      SiteID ='"+siteid+"'\n" +
        "    GROUP BY\n" +
        "      hourDate,\n" +
        "      date)\n" +
        "  GROUP BY\n" +
        "    day2,\n" +
        "    hourDate) AS T2\n" +
        "ON\n" +
        "  day1=day2\n" +
        "  AND hour1=hourDate\n" +
        "ORDER BY\n" +
        "  day1,\n" +
        "  hour1"
    const options = {
        query: sqlQuery,
        useQueryCache : false,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}


module.exports.getYesterdayBounceRate = function(siteid) {
    let nowTime = new Date().toLocaleString();
    var sqlQuery =
        "SELECT count " +
        "FROM (SELECT COUNT(*) as count " +
              "FROM [simbla-analytics:test_dataset.pages] " +
              "WHERE SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) < TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24" +
              "GROUP BY SessionID) " +
        "WHERE count = 1 ";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };

    return runQuery(options).then(function (results) {
        return module.exports.getYesterdaySessionCount(siteid).then((results2) => {return results.length / results2.length * 100});
    });
}

module.exports.getBounceRate = function(siteid) {
    let nowTime = new Date().toLocaleString();
    var sqlQuery =
        "SELECT count " +
        "FROM (SELECT COUNT(*) as count " +
        "FROM [simbla-analytics:test_dataset.pages] " +
        "WHERE SiteID = '" + siteid + "' " +
        "GROUP BY SessionID) " +
        "WHERE count = 1 ";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };

    return runQuery(options).then(function (results) {
        return module.exports.getSessionCount(siteid).then((results2) => {return results.length / results2.length * 100});
    });
}


module.exports.getFirstVisitsByHours = function(siteid) {
    let nowTime = new Date().toLocaleString();
    var sqlQuery = "SELECT HOUR(TIMESTAMP(Time)) as timer, COUNT(HOUR(TIMESTAMP(Time))) " +
                   "FROM (SELECT Time FROM [simbla-analytics:test_dataset.visits] " +
                   "WHERE  FirstVisit = true && SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24) " +
                   "GROUP BY timer ORDER BY timer";
    const options = {
        query: sqlQuery,
        useQueryCache : false, //Default is True.
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getTotalVisits = function(siteid) {
    var sqlQuery = "SELECT COUNT(Time) as visits " +
        "FROM test_dataset.visits WHERE SiteID = '" + siteid +
        "'";
    const options = {
        query: sqlQuery,
        useQueryCache : false, //Default is True.
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getYesterdayTotalVisits = function(siteid) {
    let nowTime = new Date().toLocaleString();
    var sqlQuery = "SELECT COUNT(Time) as visits " +
        "FROM [simbla-analytics:test_dataset.visits] WHERE SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24"
        "";
    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getYesterdayTotalFirstVisits = function(siteid) {
    let nowTime = new Date().toLocaleString();
    var sqlQuery = "SELECT COUNT(Time) as visits " +
        "FROM [simbla-analytics:test_dataset.visits] WHERE SiteID = '" + siteid +
        "' && FirstVisit = true && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24";
    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getTotalFirstVisits = function(siteid) {
    var sqlQuery = "SELECT COUNT(Time) as visits " +
        "FROM test_dataset.visits WHERE SiteID = '" + siteid +
        "' AND FirstVisit = true";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}


module.exports.getRecencyRate = function(siteid) {
    var sqlQuery = "SELECT COUNT(Time) as visits " +
        "FROM test_dataset.visits WHERE SiteID = '" + siteid +
        "' AND FirstVisit = false";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };

    return runQuery(options).then(function (results) {
        return module.exports.getTotalFirstVisits(siteid).then((results2) => {return (results[0].visits / (results2[0].visits + results[0].visits)) * 100});
    });

}

module.exports.getYesterdayRecencyRate = function(siteid) {
    let nowTime = new Date().toLocaleString();
    var sqlQuery = "SELECT COUNT(Time) as visits " +
        "FROM [simbla-analytics:test_dataset.visits] WHERE SiteID = '" + siteid +
        "' && FirstVisit = false && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) < TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24";
    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };

    return runQuery(options).then(function (results) {
        return module.exports.getFromYesterdayTotalFirstVisits(siteid).then((results2) => {return (results[0].visits / (results2[0].visits + results[0].visits)) * 100});
    });

}
module.exports.getFromYesterdayTotalFirstVisits = function(siteid) {
    let nowTime = new Date().toLocaleString();
    var sqlQuery = "SELECT COUNT(Time) as visits " +
        "FROM [simbla-analytics:test_dataset.visits] WHERE SiteID = '" + siteid +
        "' && FirstVisit = true && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) < TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24";
    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getAverageLoadTime = function(siteid)
{
    var sqlQuery = "SELECT AVG(LoadTime) AS avg " +
        "FROM test_dataset.visits WHERE SiteID = '" + siteid+"'";
    const options = {
        query: sqlQuery,
        useQueryCache : false,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };

    return runQuery(options)
}

module.exports.getEngagementRate = function(siteid) {
    var sqlQuery =
        "SELECT AVG(max - min) / 60000000 as avg " +
        "FROM (SELECT SessionID, MAX(Time) as max, MIN(Time) as min " +
        "FROM [simbla-analytics:test_dataset.pages] " +
        "WHERE SiteID = '" + siteid + "' " +
        "GROUP BY SessionID) ";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getYesterdayEngagementRate = function(siteid) {
    let nowTime = new Date().toLocaleString();
    var sqlQuery =
        "SELECT AVG(max - min) / 60000000 as avg " +
        "FROM (SELECT SessionID, MAX(Time) as max, MIN(Time) as min " +
        "FROM [simbla-analytics:test_dataset.pages] " +
        "WHERE SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) < TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24  " +
        "GROUP BY SessionID) ";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getVisitsCountByOs = function(siteid,time) {
    var sqlQuery = "SELECT Os, COUNT(Os) as visits " +
        "FROM [simbla-analytics:test_dataset.visits] "+
        "WHERE SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > (TIMESTAMP_TO_SEC(current_timestamp()) - 60*60*24*" + time + ") " +
        " GROUP BY Os ORDER BY visits DESC;";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getVisitsCountByReferr = function(siteid, time) {
    var sqlQuery = "SELECT Referr, COUNT(Referr) as visits " +
        "FROM [simbla-analytics:test_dataset.visits] "+
        "WHERE SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > (TIMESTAMP_TO_SEC(current_timestamp()) - 60*60*24*" + time + ") " +
        " GROUP BY Referr ORDER BY visits DESC LIMIT 5;";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getAllPointsOfSite = function (siteid) {
    var sqlQuery = "SELECT X as x,Y as y, COUNT(x) as value" +
        " FROM test_dataset.click_heatmap WHERE SiteID= '"+siteid+
        "' GROUP BY x,y LIMIT 10000;";           //Limited to 10000 points.
    const options = {
        query: sqlQuery,
        useQueryCache : false,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };

    return runQuery(options);
}


module.exports.insertScrollPercentage = function (siteid ,pageid ,scroll ,time) {
    bigquery
        .dataset(datasetId)
        .table("scrolls")
        .insert([{SiteID: siteid, PageID: pageid, Scroll: scroll, Time: time}])
        .then(() => {
            console.log(`new scroll inserted`);
        })
        .catch(err => {
            if (err && err.name === 'PartialFailureError') {
                if (err.errors && err.errors.length > 0) {
                    console.log('scroll insert errors:');
                    err.errors.forEach(err => console.error(err));
                }
            } else {
                console.error('ERROR:', err);
            }
        });
}

module.exports.getSiteScrollingPercentage = function(siteid,time) {
    var sqlQuery = "SELECT PageID, AVG(scroll) as scroll " +
        "FROM [simbla-analytics:test_dataset.scrolls] "+
        "WHERE SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(Time) > (TIMESTAMP_TO_SEC(current_timestamp()) - 60*60*24*" + time + ") " +
        " GROUP BY PageID;";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getSourcesCampaigns = function(siteid) {
    var sqlQuery = "SELECT utm_source , utm_campaign,\n" +
        "  COUNT(utm_campaign) AS count " +
        "FROM test_dataset.Campaigns WHERE SiteID = '" + siteid +
        "' GROUP BY SiteID,\n" +
        "  utm_source,\n" +
        "  utm_campaign;";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getCampaignsData = function(siteid) {
    var sqlQuery = "SELECT utm_source , utm_campaign , utm_medium,\n" +
        "  COUNT(utm_medium) AS count " +
        "FROM test_dataset.Campaigns WHERE SiteID = '" + siteid +
        "' GROUP BY SiteID,\n" +
        "  utm_source," +
        "  utm_campaign,\n" +
        "  utm_medium;";
    const options = {
        query: sqlQuery,
        useLegacySql: false,
        // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}



//The url are returned with their amount of visits.
module.exports.getURLsBySiteId = function (siteid) {
    var sqlQuery = "SELECT SiteURL AS url , COUNT(SiteURL) AS quantity"+
        " FROM test_dataset.visits"+
        " WHERE SiteId = '"+siteid+"'"+
        " GROUP BY url" +
        " LIMIT 1500";
    const options = {
        query: sqlQuery,
        useQueryCache : false, //Default is True.
        useLegacySql: false, // Use standard SQL syntax for queries.
    };

    return runQuery(options);
}


var test =function () {
    var sqlQuery = "SELECT *" +
        " FROM test_dataset.click_heatmap "//Limited to 10000 points.
    const options = {
        query: sqlQuery,
        useQueryCache : false,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };

    return runQuery(options);
};


function runQuery(options)
{
    return bigquery
        .query(options)
        .then(results => {
            var rows = results[0];
            return rows;
        });
}

