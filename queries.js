const datasetId = "test_dataset";
const visitsTable = "visits";

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
        .insert([{SiteID:siteId, SiteURL:siteURL, Time:date, Country:country, FirstVisit:firstVisit}])
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

module.exports.getVistsCountByCountry = function(siteid) {
    var sqlQuery = "SELECT Country, COUNT(Country) as visits " +
                "FROM test_dataset.visits " +
                "WHERE siteId = '" + siteid +
                "' GROUP BY Country ORDER BY visits DESC;";
    const options = {
        query: sqlQuery,
        useLegacySql: false, // Use standard SQL syntax for queries.
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