// Description:
//   Show current Heroku status and issues

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot heroku status - Returns the current Heroku status for app operations and tools
//   hubot heroku status issues <limit> - Returns a list of recent <limit> issues (default limit is 5)
//   hubot heroku status issue <id> - Returns a single issue by ID number

// Author:
//   juno
var status, statusIssue, statusIssues;

module.exports = function(robot) {
  robot.respond(/heroku status$/i, function(msg) {
    return status(msg);
  });
  robot.respond(/heroku status issues\s?(\d*)/i, function(msg) {
    var limit;
    limit = msg.match[1] || 5;
    return statusIssues(msg, limit);
  });
  return robot.respond(/heroku status issue (\d+)/i, function(msg) {
    var id;
    id = msg.match[1];
    return statusIssue(msg, id);
  });
};

status = function(msg) {
  return msg.http("https://status.heroku.com/api/v3/current-status").get()(function(err, res, body) {
    var error, json;
    try {
      json = JSON.parse(body);
      return msg.send(`Production:  ${json['status']['Production']}\n` + `Development: ${json['status']['Development']}\n`);
    } catch (error1) {
      error = error1;
      return msg.send("Uh oh, I had trouble figuring out what the Heroku cloud is up to.");
    }
  });
};

statusIssues = function(msg, limit) {
  limit = msg.match[1] || 5;
  return msg.http(`https://status.heroku.com/api/v3/issues?limit=${limit}`).get()(function(err, res, body) {
    var buildIssue, error, issue, json;
    try {
      json = JSON.parse(body);
      buildIssue = function(issue) {
        var s;
        s = `[#${issue['id']}] ${issue['title']} `;
        return s += issue['resolved'] ? "(resolved)" : "(unresolved)";
      };
      return msg.send(((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = json.length; i < len; i++) {
          issue = json[i];
          results.push(buildIssue(issue));
        }
        return results;
      })()).join("\n"));
    } catch (error1) {
      error = error1;
      return msg.send("Uh oh, I had trouble figuring out what the Heroku cloud is up to.");
    }
  });
};

statusIssue = function(msg, id) {
  return msg.http(`https://status.heroku.com/api/v3/issues/${id}`).get()(function(err, res, body) {
    var error, json;
    try {
      json = JSON.parse(body);
      return msg.send(`Title:     ${json['title']}\n` + `Resolved: ${json['resolved']}\n` + `Created:  ${json['created_at']}\n` + `Updated:  ${json['updated_at']}\n` + `URL:      https://status.heroku.com/incidents/${id}\n`);
    } catch (error1) {
      error = error1;
      return msg.send("Uh oh, I had trouble figuring out what the Heroku cloud is up to.");
    }
  });
};
