// Description: 
//   Listens for patterns matching youtrack issues and provides information about 
//   them

// Dependencies:
//   url

// Configuration:
//   HUBOT_YOUTRACK_HOSTNAME = <host:port>
//   HUBOT_YOUTRACK_USERNAME = <user name>
//   HUBOT_YOUTRACK_PASSWORD = <password>
//   HUBOT_YOUTRACK_URL      = <scheme>://<username>:<password>@<host:port>/<basepath>

// Commands:
//   what are my issues? - Show my in progress issues
//   what can I work on? - Show open issues
//   #project-number - responds with a summary of the issue

// Author:
//   Dusty Burwell, Jeremy Sellars and Jens Jahnke
var URL, getProject, host, http, https, password, path, scheme, url_parts, username, youTalkinToMe, yt_url;

URL = require("url");

http = require('http');

https = require('https');

yt_url = process.env.HUBOT_YOUTRACK_URL;

host = process.env.HUBOT_YOUTRACK_HOSTNAME;

username = process.env.HUBOT_YOUTRACK_USERNAME;

password = process.env.HUBOT_YOUTRACK_PASSWORD;

if (yt_url != null) {
  url_parts = URL.parse(yt_url);
  scheme = url_parts.protocol;
  username = url_parts.auth.split(":")[0];
  password = url_parts.auth.split(":")[1];
  host = url_parts.host;
  if (url_parts.pathname != null) {
    path = url_parts.pathname;
  }
} else {
  scheme = 'http://';
}

// http://en.wikipedia.org/wiki/You_talkin'_to_me%3F
youTalkinToMe = function(msg, robot) {
  var input, name;
  input = msg.message.text.toLowerCase();
  name = robot.name.toLowerCase();
  return input.indexOf(name) !== -1;
};

getProject = function(msg) {
  var s;
  return s = msg.message.room.replace(/-.*/, '');
};

module.exports = function(robot) {
  var askYoutrack, getUserNameFromMessage, handleIssues, hashTagYoutrackIssueNumber, login;
  robot.hear(/what (are )?my issues/i, function(msg) {
    if (Math.random() < .2) {
      return msg.send(`@${msg.message.user.name}, you have many issues.  Shall I enumerate them?  I think not.`);
    }
  });
  robot.hear(/what ((are )?my issues|am I (doing|working on|assigned))/i, function(msg) {
    var filter;
    if (!youTalkinToMe(msg, robot)) {
      return;
    }
    filter = `for:+${getUserNameFromMessage(msg)}+state:-Resolved,%20-Completed,%20-Blocked%20,%20-{To%20be%20discussed}`;
    return askYoutrack(`/rest/issue?filter=${filter}&with=summary&with=state`, function(err, issues) {
      return handleIssues(err, issues, msg, filter);
    });
  });
  robot.hear(/what (can|might|should)\s+(I|we)\s+(do|work on)/i, function(msg) {
    var filter;
    if (!youTalkinToMe(msg, robot)) {
      return;
    }
    filter = `Project%3a%20${getProject(msg)}%20state:-Resolved,%20-Completed,%20-Blocked%20,%20-{To%20be%20discussed}`;
    return askYoutrack(`/rest/issue?filter=${filter}&with=summary&with=state&max=100`, function(err, issues) {
      return handleIssues(err, issues, msg, filter);
    });
  });
  hashTagYoutrackIssueNumber = /#([^-]+-[\d]+)/i;
  robot.hear(hashTagYoutrackIssueNumber, function(msg) {
    var issueId;
    issueId = msg.match[1];
    return askYoutrack(`/rest/issue/${issueId}`, function(err, issue) {
      var field, i, len, ref, summary;
      if (err != null) {
        return msg.send("I'd love to tell you about it, but there was an error looking up that issue");
      }
      if (issue.field) {
        ref = issue.field;
        for (i = 0, len = ref.length; i < len; i++) {
          field = ref[i];
          if (field.name === 'summary') {
            summary = field.value;
          }
        }
        return msg.send(`You're talking about ${scheme}${host}/issue/${issueId}\r\nsummary: ${summary}`);
      } else {
        return msg.send("I'd love to tell you about it, but I couldn't find that issue");
      }
    });
  });
  handleIssues = function(err, issues, msg, filter) {
    var issue, issueId, issueLines, resp, state, summary, topIssues, url, verb;
    return msg.send(err != null ? 'Not to whine, but\r\n' + err.toString() : !issues.issue.length ? `${msg.message.user.name}, I guess you get to go home because there's nothing to do` : (topIssues = issues.issue.length <= 5 ? issues.issue : issues.issue.slice(0, 5), resp = `${msg.message.user.name}, perhaps you will find one of these ${topIssues} ${getProject(msg)} issues to your liking:\r\n`, issueLines = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = topIssues.length; i < len; i++) {
        issue = topIssues[i];
        summary = issue.field[0].value;
        state = issue.field[1].value;
        issueId = issue.id;
        verb = (state.toString() === "Open" ? "Start" : "Finish");
        results.push(`${verb} "${summary}" (${scheme}${host}/issue/${issueId})`);
      }
      return results;
    })(), resp += issueLines.join(',\r\nor maybe '), topIssues.length !== issues.issue.length ? (url = `${scheme}${host}/issues/?q=${filter}`, resp += '\r\n' + `or maybe these ${issues.issue.length}: ${url}`) : void 0, resp));
  };
  getUserNameFromMessage = function(msg) {
    var user;
    user = msg.message.user.name;
    if (user = "Shell") {
      user = 'me';
    }
    return user;
  };
  askYoutrack = function(path, callback) {
    return login(function(login_res) {
      var ask_options, ask_req, cookie, cookies;
      cookies = (function() {
        var i, len, ref, results;
        ref = login_res.headers['set-cookie'];
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          cookie = ref[i];
          results.push(cookie.split(';')[0]);
        }
        return results;
      })();
      ask_options = {
        host: host,
        path: path,
        headers: {
          Cookie: cookies,
          Accept: 'application/json'
        }
      };
      if (path != null) {
        ask_options.path = path + ask_options.path;
      }
      ask_res(function() {
        var data;
        data = '';
        ask_res.on('data', function(chunk) {
          return data += chunk;
        });
        ask_res.on('end', function() {
          var answer;
          answer = JSON.parse(data);
          return callback(null, answer);
        });
        return ask_res.on('error', function(err) {
          return callback(err != null ? err : new Error('Error getting answer from youtrack'));
        });
      });
      if (scheme === 'https://') {
        ask_req = https.get(ask_options, ask_res);
      } else {
        ask_req = http.get(ask_options, ask_res);
      }
      return ask_req.on('error', function(e) {
        return callback(e != null ? e : new Error('Error asking youtrack'));
      });
    });
  };
  return login = function(handler) {
    var login_req, options;
    options = {
      host: host,
      path: `/rest/user/login?login=${username}&password=${password}`,
      method: "POST"
    };
    if (path != null) {
      options.path = path + options.path;
    }
    if (scheme === 'https://') {
      login_req = https.request(options, handler);
    } else {
      login_req = http.request(options, handler);
    }
    return login_req.end();
  };
};
