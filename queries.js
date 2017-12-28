const datasetId = "test_dataset";
const visitsTable = "visits";
const sessionsTable = "sessions";

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
module.exports.insertVisit = function (siteId, siteURL, date , country, firstVisit) {
    bigquery
        .dataset(datasetId)
        .table(visitsTable)
        .insert([{SiteID: siteId, SiteURL: siteURL, Time: date, Country: country, FirstVisit: firstVisit}])
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
        .table(sessionsTable)
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
        .table(sessionsTable)
        .insert([{SiteId: siteid, PageId: pageid, Time: time}])
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
    return runQuery(options);
}

module.exports.getSessionsAverageTime = function(siteid) {
    var sqlQuery = "SELECT AVG(TIMESTAMP_TO_SEC(StartSessionTime) - TIMESTAMP_TO_SEC(EndSessionTime) " +
        "FROM [simbla-analytics:test_dataset.sessions] WHERE SiteId = '" + siteid + "'";

    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
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

module.exports.getVistsByHours = function(siteid) {
    var nowTime = new Date().toLocaleString();
    var sqlQuery = "SELECT HOUR(TIMESTAMP(Time)) as timer, COUNT(HOUR(TIMESTAMP(Time))) " +
                   "FROM (SELECT Time FROM [simbla-analytics:test_dataset.visits] " +
                   "WHERE  SiteId = '" + siteid + "' && TIMESTAMP_TO_SEC(TIMESTAMP(Time)) > TIMESTAMP_TO_SEC(TIMESTAMP('" + nowTime + "')) - 60*60*24) " +
                   "GROUP BY timer ORDER BY timer";
    const options = {
        query: sqlQuery,
        useLegacySql: true, // Use standard SQL syntax for queries.
    };
    return runQuery(options);
}

module.exports.getFirstVistsByHours = function(siteid) {
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

function runQuery(options)
{
    return bigquery
        .startQuery(options)
        .then(results => {
            job = results[0];
            return job.promise();
        })
        .then(() => {
            // Get the job's status
            return job.getMetadata();
        })
        .then(metadata => {
            // Check the job's status for errors
            const errors = metadata[0].status.errors;
            if (errors && errors.length > 0) {
                throw errors;
            }
        })
        .then(() => {;
            return job.getQueryResults();
        })
        .then(results => {
            const rows = results[0];
            return rows;
        })
        .catch(err => {
            console.error('ERROR:', err);
        });
}