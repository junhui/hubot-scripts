// Description:
//   Can output total amount in your sales pipeline, as specified in a
//   report from SugarCRM

// Dependencies:
//   None

// Configuration:
//   HUBOT_SUGARCRM_URL
//   HUBOT_SUGARCRM_USERNAME
//   HUBOT_SUGARCRM_PASSWORD
//   HUBOT_SUGARCRM_REPORT_ID
//   HUBOT_SUGARCRM_REPORT_FIELD

// Commands:
//   hubot pipeline me - Gives the total amount in sales pipeline

// Author:
//   skalnik
var sugarCRMCall, sugarCRMLogin;

module.exports = function(robot) {
  return robot.respond(/pipeline( me)?/i, function(msg) {
    var password, reportField, reportID, url, username;
    url = process.env.HUBOT_SUGARCRM_URL;
    username = process.env.HUBOT_SUGARCRM_USERNAME;
    password = process.env.HUBOT_SUGARCRM_PASSWORD;
    reportID = process.env.HUBOT_SUGARCRM_REPORT_ID;
    reportField = process.env.HUBOT_SUGARCRM_REPORT_FIELD;
    if (!url) {
      msg.send("SugarCRM URL isn't set.");
      msg.send("Please set the HUBOT_SUGARCRM_URL environment variable without prefixed HTTP or trailing slash");
      return;
    }
    if (!username) {
      msg.send("SugarCRM username isn't set.");
      msg.send("Please set the HUBOT_SUGARCRM_USERNAME environment variable");
      return;
    }
    if (!password) {
      msg.send("SugarCRM password isn't set.");
      msg.send("Please set the HUBOT_SUGARCRM_PASSWORD environment variable");
      return;
    }
    if (!reportID) {
      msg.send("SugarCRM report ID is not set.");
      msg.send("Please set the HUBOT_SUGARCRM_REPORT_ID to the report ID of your pipeline report");
      return;
    }
    if (!reportField) {
      msg.send("SugarCRM report field is not set.");
      msg.send("Please set the HUBOT_SUGARCRM_REPORT_FIELD to the field of the report that should be totaled");
      return;
    }
    return sugarCRMLogin(msg, url, username, password, function(session) {
      var data;
      data = {
        session: session,
        ids: [reportID]
      };
      return sugarCRMCall(msg, url, 'get_report_entries', data, function(err, res, body) {
        var amount, entries, entry, fieldID, fields, i, j, json, k, len, pipelineTotal, ref;
        json = JSON.parse(body);
        entries = json.entry_list[0];
        fields = json.field_list[0];
        fieldID = -1;
        pipelineTotal = 0;
        for (i = j = 0, ref = fields.length; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
          if (fields[i].name === reportField) {
            fieldID = i;
          }
        }
        if (fieldID === -1) {
          msg.send("Could not find " + reportField + " in the report fields.");
          msg.send("Please double check HUBOT_SUGARCRM_REPORT_FIELD.");
          return;
        }
        for (k = 0, len = entries.length; k < len; k++) {
          entry = entries[k];
          if (entry.id) {
            amount = (entry.name_value_list.filter(function(field) {
              return field.name === fieldID;
            }))[0];
            pipelineTotal += parseInt(amount.value.replace(',', ''));
          }
        }
        return msg.send("Total: $" + pipelineTotal);
      });
    });
  });
};

sugarCRMLogin = function(msg, url, user_name, password, callback) {
  var crypto, data, hashedPassword;
  crypto = require('crypto');
  hashedPassword = crypto.createHash('md5').update(password).digest("hex");
  data = {
    user_auth: {
      user_name: user_name,
      password: hashedPassword
    }
  };
  return sugarCRMCall(msg, url, 'login', data, function(err, res, body) {
    var sessionID;
    sessionID = JSON.parse(body).id;
    return callback(sessionID);
  });
};

sugarCRMCall = function(msg, url, method, data, callback) {
  return msg.http('https://' + url + '/service/v4/rest.php').header('Content-Length', 0).query({
    method: method,
    input_type: 'JSON',
    response_type: 'JSON',
    rest_data: JSON.stringify(data)
  }).post()(function(err, res, body) {
    return callback(err, res, body);
  });
};
