const datasetId = "test_dataset";


// Creates a client
const BigQuery = require('@google-cloud/bigquery');
const projectId = "simbla-analytics";
var sync = require('sync');
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

module.exports.insertSession = function (siteId,siteURL, startSessionTime ,endSessionDate) {
    bigquery
        .dataset(datasetId)
        .table("sessions")
        .insert([{SiteID: siteId, SiteURL: siteURL, StartSessionTime: startSessionTime, EndSessionTime: endSessionDate}])
        .then(() => {
            console.log(`Session inserted`);
        })
        .catch(err => {
            if (err && err.name === 'PartialFailureError') {
                if (err.errors && err.errors.length > 0) {
                    console.log('session insert errors:');
                    err.errors.forEach(err => console.error(err));
                }
            } else {
                console.error('ERROR:', err);
            }
        });
}

module.exports.insertPageChange = function (siteid ,pageid , time) {
    bigquery
        .dataset(datasetId)
        .table("pages")
        .insert([{SiteID: siteid, PageID: pageid, Time: time}])
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
    var sqlQuery = "SELECT PageId , COUNT(pageId) as popularity FROM " +
        "(SELECT PageId FROM [simbla-analytics:test_dataset.pages] " +
        "WHERE SiteId = '" + siteid + "' && TIMESTAMP_TO_SEC(TIME) > (TIMESTAMP_TO_SEC(current_timestamp()) - 60*60*24*30)) " +
        "GROUP BY PageId ORDER BY PageId";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options)
}


module.exports.getVistsCountByCountry = function(siteid) {
    var sqlQuery = "SELECT Country, COUNT(Country) as visits " +
        "FROM test_dataset.visits WHERE SiteId = '" + siteid +
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
        "WHERE SiteId = '" + siteid + "' && Country = '" + country + "';";

    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    return runQuery(options)
}

module.exports.getVisitsByHours = function(siteid) {
    var nowTime = new Date().toLocaleString();
    var sqlQuery = "SELECT HOUR(TIMESTAMP(Time)) as timer , COUNT(*) " +
                   "FROM (SELECT Time FROM [simbla-analytics:test_dataset.visits] " +
                          "WHERE  SiteId = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24) " +
                   "GROUP BY timer ORDER BY timer" ;
    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getBounceRate = function(siteid) {
    var sqlQuery =
        "SELECT COUNT(*)" +
        "FROM (SELECT COUNT(*) as count" +
               "FROM (SELECT StartSessionTime, EndSessionTime, DISTINCT PageID " +
                     "FROM [simbla-analytics:test_dataset.sessions] JOIN [simbla-analytics:test_dataset.pages] ON SiteID " +
                     "WHERE SiteID = '" + siteid + "' && StartSessionTime < Time && EndSessionTime > Time) " +
               "GROUP BY StartSessionTime, EndSessionTime) " +
        "WHERE count = 1";
    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getFirstVisitsByHours = function(siteid) {
    var nowTime = new Date().toLocaleString();
    var sqlQuery = "SELECT HOUR(TIMESTAMP(Time)) as timer, COUNT(HOUR(TIMESTAMP(Time))) " +
                   "FROM (SELECT Time FROM [simbla-analytics:test_dataset.visits] " +
                   "WHERE  FirstVisit = true && SiteId = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24) " +
                   "GROUP BY timer ORDER BY timer";
    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getTotalVisits = function(siteid) {
    var sqlQuery = "SELECT COUNT(Time) as visits " +
        "FROM test_dataset.visits WHERE SiteId = '" + siteid +
        "'";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getTotalFirstVisits = function(siteid) {
    var sqlQuery = "SELECT COUNT(Time) as visits " +
        "FROM test_dataset.visits WHERE SiteId = '" + siteid +
        "' AND firstVisit = true";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getRecencyRate = function(siteid) {
    var sqlQuery = "SELECT COUNT(Time) as visits " +
        "FROM test_dataset.visits WHERE SiteId = '" + siteid +
        "' AND firstVisit = false";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };

    var resultLength = runQuery(options).size;
    return resultLength / (getTotalFirstVisits(siteid).size + resultLength);
}
Bounce

module.exports.getEngagementRate = function(siteid) {
    var sqlQuery = "SELECT AVG(TIMESTAMP_TO_SEC(StartSessionTime) - TIMESTAMP_TO_SEC(EndSessionTime) " +
        "FROM [simbla-analytics:test_dataset.sessions] WHERE SiteId = '" + siteid + "'";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getVisitsCountByOs = function(siteid) {
    var sqlQuery = "SELECT Os, COUNT(Os) as visits " +
        "FROM test_dataset.visits WHERE SiteId = '" + siteid +
        "' GROUP BY Os ORDER BY visits DESC;";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getVisitsCountByReferr = function(siteid) {
    var sqlQuery = "SELECT Referr, COUNT(Referr) as visits " +
        "FROM test_dataset.visits WHERE SiteId = '" + siteid +
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
        "FROM test_dataset.visits WHERE SiteId = '" + siteid +
        "' GROUP BY Referr ORDER BY visits DESC;";
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