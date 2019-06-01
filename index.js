require('dotenv').config()
const request = require('request');
const fs = require('fs');
const util = require('util');

const mergeCsv = [];
const websites = []; // to be added

const constructCsvRow = (website, callback) => {
  let csvRows = '';
  let response;
  let options = {
    method: 'GET',
    uri: 'https://api.datanyze.com/domain_info/',
    qs: {
      email: process.env.EMAIL,
      token: process.env.TOKEN,
      domain: website,
      tech_details: 'true'
    }
  }

  request(options, (err, res, body) => {
    if (err) {
      callback(err);
    } else {
      response = JSON.parse(body);
      rows = response.technologies;
      for (key in rows) {
        csvRows += `"${website}","${rows[key].name}","${rows[key].type_name}","${rows[key].first_seen}","${rows[key].last_seen}"\n`;
      }
      callback(null, csvRows);
    }
  });
};

const asyncConstructCsvRow = util.promisify(constructCsvRow);

for (var i = 0; i < websites.length; i++) {
  mergeCsv.push(asyncConstructCsvRow(websites[i]));
}

Promise.all(mergeCsv)
  .then((csvRows) => {
    csvRows.unshift(`"website","application","type","first seen date","last seen date"\n`);
    const csv = csvRows.join('');
    const csvName = `/output/${websites[0]}_report_${Date.now()}.csv`;
    let writeStream = fs.createWriteStream(csvName);

    // write to file
    writeStream.write(csv, 'utf8');

    // the finish event is emitted when all data has been flushed from the stream
    writeStream.on('finish', () => {  
      console.log('wrote all data to file');
    });

    // close the stream
    writeStream.end();
  })
  .catch((err) => {
    throw err;
  });
