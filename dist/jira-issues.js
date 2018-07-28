// Description:
//   Looks up jira issues when they're mentioned in chat

//   Will ignore users set in HUBOT_JIRA_ISSUES_IGNORE_USERS (by default, JIRA and GitHub).

// Dependencies:
//   None

// Configuration:
//   HUBOT_JIRA_URL (format: "https://jira-domain.com:9090")
//   HUBOT_JIRA_IGNORECASE (optional; default is "true")
//   HUBOT_JIRA_USERNAME (optional)
//   HUBOT_JIRA_PASSWORD (optional)
//   HUBOT_JIRA_ISSUES_IGNORE_USERS (optional, format: "user1|user2", default is "jira|github")

// Commands:

// Author:
//   stuartf
module.exports = function(robot) {
  var auth, cache, jiraIgnoreUsers, jiraPassword, jiraUrl, jiraUsername;
  cache = [];
  // In case someone upgrades form the previous version, we'll default to the 
  // previous behavior.
  jiraUrl = process.env.HUBOT_JIRA_URL || `https://${process.env.HUBOT_JIRA_DOMAIN}`;
  jiraUsername = process.env.HUBOT_JIRA_USERNAME;
  jiraPassword = process.env.HUBOT_JIRA_PASSWORD;
  if (jiraUsername !== void 0 && jiraUsername.length > 0) {
    auth = `${jiraUsername}:${jiraPassword}`;
  }
  jiraIgnoreUsers = process.env.HUBOT_JIRA_ISSUES_IGNORE_USERS;
  if (jiraIgnoreUsers === void 0) {
    jiraIgnoreUsers = "jira|github";
  }
  return robot.http(jiraUrl + "/rest/api/2/project").auth(auth).get()(function(err, res, body) {
    var entry, ic, jiraPattern, jiraPrefixes, json, reducedPrefixes;
    json = JSON.parse(body);
    jiraPrefixes = (function() {
      var j, len, results;
      results = [];
      for (j = 0, len = json.length; j < len; j++) {
        entry = json[j];
        results.push(entry.key);
      }
      return results;
    })();
    reducedPrefixes = jiraPrefixes.reduce(function(x, y) {
      return x + "-|" + y;
    });
    jiraPattern = "/\\b(" + reducedPrefixes + "-)(\\d+)\\b/g";
    ic = process.env.HUBOT_JIRA_IGNORECASE;
    if (ic === void 0 || ic === "true") {
      jiraPattern += "i";
    }
    return robot.hear(eval(jiraPattern), function(msg) {
      var i, issue, item, j, k, len, len1, now, ref, results;
      if (msg.message.user.name.match(new RegExp(jiraIgnoreUsers, "gi"))) {
        return;
      }
      ref = msg.match;
      results = [];
      for (j = 0, len = ref.length; j < len; j++) {
        i = ref[j];
        issue = i.toUpperCase();
        now = new Date().getTime();
        if (cache.length > 0) {
          while (!(cache.length === 0 || cache[0].expires >= now)) {
            cache.shift();
          }
        }
        for (k = 0, len1 = cache.length; k < len1; k++) {
          item = cache[k];
          if (item.issue === issue) {
            msg.send(item.message);
          }
        }
        if (cache.length === 0 || ((function() {
          var l, len2, results1;
          results1 = [];
          for (l = 0, len2 = cache.length; l < len2; l++) {
            item = cache[l];
            if (item.issue === issue) {
              results1.push(item);
            }
          }
          return results1;
        })()).length === 0) {
          results.push(robot.http(jiraUrl + "/rest/api/2/issue/" + issue).auth(auth).get()(function(err, res, body) {
            var error, key, message, reallyError, urlRegex;
            try {
              json = JSON.parse(body);
              key = json.key;
              message = "[" + key + "] " + json.fields.summary;
              message += '\nStatus: ' + json.fields.status.name;
              if (json.fields.assignee === null) {
                message += ', unassigned';
              } else if ('value' in json.fields.assignee || 'displayName' in json.fields.assignee) {
                if (json.fields.assignee.name === "assignee" && json.fields.assignee.value.displayName) {
                  message += ', assigned to ' + json.fields.assignee.value.displayName;
                } else if (json.fields.assignee && json.fields.assignee.displayName) {
                  message += ', assigned to ' + json.fields.assignee.displayName;
                }
              } else {
                message += ', unassigned';
              }
              message += ", rep. by " + json.fields.reporter.displayName;
              if (json.fields.fixVersions && json.fields.fixVersions.length > 0) {
                message += ', fixVersion: ' + json.fields.fixVersions[0].name;
              } else {
                message += ', fixVersion: NONE';
              }
              if (json.fields.priority && json.fields.priority.name) {
                message += ', priority: ' + json.fields.priority.name;
              }
              urlRegex = new RegExp(jiraUrl + "[^\\s]*" + key);
              if (!msg.message.text.match(urlRegex)) {
                message += "\n" + jiraUrl + "/browse/" + key;
              }
              msg.send(message);
              return cache.push({
                issue: issue,
                expires: now + 120000,
                message: message
              });
            } catch (error1) {
              error = error1;
              try {
                return msg.send("[*ERROR*] " + json.errorMessages[0]);
              } catch (error1) {
                reallyError = error1;
                return msg.send("[*ERROR*] " + reallyError);
              }
            }
          }));
        } else {
          results.push(void 0);
        }
      }
      return results;
    });
  });
};
