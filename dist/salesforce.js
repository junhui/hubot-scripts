// Description:
//   Get connected to the Salesforce.com REST API and do something fun!

// Dependencies:
//   None

// Configuration:
//   SF_INSTANCE_URL = url of your salesforce instance eg. https://na2.salesforce.com
//	SF_CONSUMER_KEY = consumer key from the Remote Access Setup page in Salesforce
//	SF_CONSUMER_SECRET = consumer secret from the Remote Access Setup page in Salesforce
//	SF_USERNAME = a valid salesforce login
//	SF_PASSWORD = password and security token mashed together

// Commands:
//   hubot salesforce account <accountname> - searches for the account by name in Salesforce and displays all matches
//   hubot salesforce query <query> - runs an arbitrary SOQL query and outputs the results

// Author:
//   lnediger
var auth_url, http, query_url, sf_consumer_key, sf_consumer_secret, sf_instance, sf_password, sf_username;

sf_instance = process.env.SF_INSTANCE_URL;

sf_consumer_key = process.env.SF_CONSUMER_KEY;

sf_consumer_secret = process.env.SF_CONSUMER_SECRET;

sf_username = process.env.SF_USERNAME;

sf_password = process.env.SF_PASSWORD;

auth_url = `${sf_instance}/services/oauth2/token?grant_type=password&client_id=${sf_consumer_key}&client_secret=${sf_consumer_secret}&username=${sf_username}&password=${sf_password}`;

query_url = `${sf_instance}/services/data/v20.0/query?q=`;

http = require('http');

module.exports = function(robot) {
  robot.respond(/salesforce query (.*)$/i, function(msg) {
    var query;
    query = msg.match[1];
    return msg.http(auth_url).post()(function(err, res, body) {
      var oath_token;
      oath_token = JSON.parse(body).access_token;
      query = encodeURIComponent(query);
      return msg.http(query_url + query).headers({
        Authorization: `OAuth ${oath_token}`
      }).get()(function(err, res, body) {
        var i, j, key, len, len1, ref, ref1, result, result_string, results, results1;
        if (err) {
          msg.send(`Salesforce says: ${err}`);
          return;
        }
        results = JSON.parse(body);
        if (results.records === void 0 || results.records.length === 0) {
          return msg.send("No results found!");
        } else {
          msg.send(`Found ${results.records.length} results(s) of type ${results.records[0].attributes.type}`);
          ref = results.records;
          results1 = [];
          for (i = 0, len = ref.length; i < len; i++) {
            result = ref[i];
            result_string = "";
            ref1 = Object.keys(result);
            for (j = 0, len1 = ref1.length; j < len1; j++) {
              key = ref1[j];
              if (key !== "attributes") {
                result_string += `${key} : ${result[key]}, `;
              }
            }
            results1.push(msg.send(result_string.substring(0, result_string.length - 1)));
          }
          return results1;
        }
      });
    });
  });
  return robot.respond(/salesforce account (.*)$/i, function(msg) {
    var acct_name;
    acct_name = msg.match[1];
    return msg.http(auth_url).post()(function(err, res, body) {
      var acct_query, oath_token;
      oath_token = JSON.parse(body).access_token;
      acct_query = `SELECT Owner.Name, Name, Phone, Id From Account where Name = '${acct_name}'`;
      acct_query = encodeURIComponent(acct_query);
      return msg.http(query_url + acct_query).headers({
        Authorization: `OAuth ${oath_token}`
      }).get()(function(err, res, body) {
        var account, accounts, i, len, ref, results1;
        if (err) {
          msg.send(`Salesforce says: ${err}`);
          return;
        }
        accounts = JSON.parse(body);
        if (accounts.records === void 0 || accounts.records.length === 0) {
          return msg.send("No accounts found!");
        } else {
          msg.send(`Found ${accounts.records.length} Account(s) matching '${acct_name}'`);
          ref = accounts.records;
          results1 = [];
          for (i = 0, len = ref.length; i < len; i++) {
            account = ref[i];
            results1.push(msg.send(`Owner: ${account.Owner.Name}, Name: ${account.Name}, Phone: ${account.Phone}, Id: ${account.Id}`));
          }
          return results1;
        }
      });
    });
  });
};
