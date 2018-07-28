// Description:
//   Get all bugs from JIRA assigned to user

// Dependencies:
//   None

// Configuration:
//   HUBOT_JIRA_DOMAIN
//   HUBOT_JIRA_USER
//   HUBOT_JIRA_PASSWORD
//   HUBOT_JIRA_ISSUE_TYPES
//   HUBOT_JIRA_ISSUE_PRIORITIES

// Commands:
//   hubot list my bugs - Retrieve the list of all a user's bugs from JIRA ('my' is optional)
//   hubot list my bugs about <searchterm> - Retrieve list of all a user's bugs from JIRA where the summary or description field contains <phrase> ('my' is optional)
//   hubot list my <priority> priority bugs  - Retrieve the list of a user's <priority> priority bugs from JIRA ('my' is optional)
//   hubot list my <priority> priority bugs about <phrase> - Retrieve list of all a user's <priority> priority bugs from JIRA where the summary or description field contains <phrase> ('my' is optional)

// Author:
//   crcastle

// e.g. "bug|task|sub task|support ticket|new feature|epic"
var formatIssueList, getIssues, getJSON, issuePriorities, issueTypes, regexp, regexpString, toJiraTypeList;

issueTypes = process.env.HUBOT_JIRA_ISSUE_TYPES;

issueTypes || (issueTypes = "bug|task|sub task|support ticket|new feature|epic"); //some defaults


// e.g. "blocker|high|medium|minor|trivial"
issuePriorities = process.env.HUBOT_JIRA_ISSUE_PRIORITIES;

issuePriorities || (issuePriorities = "blocker|high|medium|minor|trivial"); //some defaults


// /list( my)?( (blocker|high|medium|minor|trivial)( priority)?)? (bug|task|sub task|support ticket|new feature|epic|issue)s( about (.*))?/i
regexpString = "list( my)?( (" + issuePriorities + ")( priority)?)? (" + issueTypes + "|issue)s( about (.*))?";

regexp = new RegExp(regexpString, "i");

module.exports = function(robot) {
  return robot.respond(regexp, function(msg) {
    var issueType, username;
    username = msg.match[1] ? msg.message.user.email.split('@')[0] : null;
    issueType = msg.match[5] && msg.match[5] !== "issue" ? msg.match[5] : null;
    msg.send("Searching for issues...");
    return getIssues(msg, issueType, username, msg.match[3], msg.match[6], function(response) {
      return msg.send(response);
    });
  });
};

getIssues = function(msg, issueType, assignee, priority, phrase, callback) {
  var auth, domain, jiraTypeList, password, path, prio, queryString, search, type, url, user, username;
  username = process.env.HUBOT_JIRA_USER;
  password = process.env.HUBOT_JIRA_PASSWORD;
  domain = process.env.HUBOT_JIRA_DOMAIN;
  // do some error handling
  if (!username) {
    msg.send("HUBOT_JIRA_USER environment variable must be set to a valid JIRA user's username.");
    return;
  }
  if (!password) {
    msg.send("HUBOT_JIRA_PASSWORD environment variable must be set to a valid JIRA user's password.");
    return;
  }
  if (!domain) {
    msg.send("HUBOT_JIRA_DOMAIN environment variables must be set to a valid <ORG>.jira.com domain.");
    return;
  }
  jiraTypeList = toJiraTypeList(process.env.HUBOT_JIRA_ISSUE_TYPES.split('|'));
  type = issueType != null ? 'issueType="' + issueType + '"' : 'issueType in (' + jiraTypeList + ')';
  user = assignee != null ? ' and assignee="' + assignee + '"' : '';
  prio = priority != null ? ' and priority=' + priority : '';
  search = phrase != null ? ' and (summary~"' + phrase + '" or description~"' + phrase + '")' : '';
  path = '/rest/api/latest/search';
  url = "https://" + domain + path;
  queryString = type + ' and status!=closed' + user + prio + search;
  auth = "Basic " + new Buffer(username + ':' + password).toString('base64');
  return getJSON(msg, url, queryString, auth, function(err, json) {
    var i, issue, issueList, len, ref, results;
    if (err) {
      msg.send("error getting issue list from JIRA");
      return;
    }
    if ((json.total != null) && (json.total === 0 || json.total === "0")) {
      msg.send("No issues like that, or you don't have access to see the issues.");
    }
    issueList = [];
    ref = json.issues;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      issue = ref[i];
      results.push(getJSON(msg, issue.self, null, auth, function(err, details) {
        if (err) {
          msg.send("error getting issue details from JIRA");
          return;
        }
        issueList.push({
          key: details.key,
          summary: details.fields.summary.value
        });
        if (issueList.length === json.issues.length) {
          return callback(formatIssueList(issueList, domain));
        }
      }));
    }
    return results;
  });
};

formatIssueList = function(issueArray, domain) {
  var formattedIssueList, i, issue, len;
  formattedIssueList = "";
  for (i = 0, len = issueArray.length; i < len; i++) {
    issue = issueArray[i];
    formattedIssueList += issue.summary + " -> https://" + domain + "/browse/" + issue.key + "\n";
  }
  return formattedIssueList;
};

getJSON = function(msg, url, query, auth, callback) {
  return msg.http(url).header('Authorization', auth).query({
    jql: query
  }).get()(function(err, res, body) {
    return callback(err, JSON.parse(body));
  });
};

toJiraTypeList = function(arr) {
  var i, issueType, len, newArr;
  newArr = [];
  for (i = 0, len = arr.length; i < len; i++) {
    issueType = arr[i];
    newArr.push('"' + issueType + '"');
  }
  return newArr.join(',');
};
