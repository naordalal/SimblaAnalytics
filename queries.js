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
module.exports.insertVisit = function (siteId, siteURL, date , country, firstVisit, referr, os) {
    bigquery
        .dataset(datasetId)
        .table("visits")
        .insert([{SiteID: siteId, SiteURL: siteURL, Time: date, Country: country, FirstVisit: firstVisit,
                    Referr: referr, Os:os}])
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

module.exports.getPagePopularity = function(siteid) {
    var sqlQuery = "SELECT PageID , COUNT(pageID) as popularity FROM " +
        "(SELECT PageID FROM [simbla-analytics:test_dataset.pages] " +
        "WHERE SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(Time) > (TIMESTAMP_TO_SEC(current_timestamp()) - 60*60*24*30)) " +
        "GROUP BY PageID ORDER BY PageID";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options)
}


module.exports.getVistsCountByCountry = function(siteid) {
    var sqlQuery = "SELECT Country, COUNT(Country) as visits " +
        "FROM test_dataset.visits WHERE SiteID = '" + siteid +
        "' GROUP BY Country ORDER BY visits DESC;";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
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

module.exports.getVisitsByHours = function(siteid) {
    var nowTime = new Date().toLocaleString();
    var sqlQuery = "SELECT HOUR(TIMESTAMP(Time)) as timer , COUNT(*) " +
                   "FROM (SELECT Time FROM [simbla-analytics:test_dataset.visits] " +
                          "WHERE  SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24) " +
                   "GROUP BY timer ORDER BY timer" ;
    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getBounceRate = function(siteid) {
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
        return module.exports.getSessionCount(siteid).then((results2) => {return results.length / results2.length});
    });
}


module.exports.getFirstVisitsByHours = function(siteid) {
    var nowTime = new Date().toLocaleString();
    var sqlQuery = "SELECT HOUR(TIMESTAMP(Time)) as timer, COUNT(HOUR(TIMESTAMP(Time))) " +
                   "FROM (SELECT Time FROM [simbla-analytics:test_dataset.visits] " +
                   "WHERE  FirstVisit = true && SiteID = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24) " +
                   "GROUP BY timer ORDER BY timer";
    const options = {
        query: sqlQuery,
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
        useLegacySql: false, // Use standard SQL syntax for queries.
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
        return module.exports.getTotalFirstVisits(siteid).then((results2) => {return results[0].visits / (results2[0].visits + results[0].visits)});
    });

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

module.exports.getVisitsCountByOs = function(siteid) {
    var sqlQuery = "SELECT Os, COUNT(Os) as visits " +
        "FROM test_dataset.visits WHERE SiteID = '" + siteid +
        "' GROUP BY Os ORDER BY visits DESC;";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getVisitsCountByReferr = function(siteid) {
    var sqlQuery = "SELECT Referr, COUNT(Referr) as visits " +
        "FROM test_dataset.visits WHERE SiteID = '" + siteid +
        "' GROUP BY Referr ORDER BY visits DESC;";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

//Now same the original referr
module.exports.getVisitsCountBySocialReferr = function(siteid) {
    var sqlQuery = "SELECT Referr, COUNT(Referr) as visits " +
        "FROM test_dataset.visits WHERE SiteID = '" + siteid +
        "' GROUP BY Referr ORDER BY visits DESC;";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getAllPointsOfSite = function (siteid) {
    var sqlQuery = "SELECT X as x,Y as y, COUNT(x) as value" +
        " FROM test_dataset.click_heatmap WHERE SiteID= '"+siteid+
        "' GROUP BY x,y LIMIT 10000;";           //Limited to 10000 points.
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };

    return runQuery(options);
}


function runQuery(options)
{
    return bigquery
        .query(options)
        .then(results => {
            var rows = results[0];
            return rows;
        });
}

