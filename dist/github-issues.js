// Description:
//   Show open issues from a Github repository

// Dependencies:
//   "underscore": "1.3.3"
//   "underscore.string": "2.1.1"
//   "githubot": "0.4.x"

// Configuration:
//   HUBOT_GITHUB_TOKEN
//   HUBOT_GITHUB_USER
//   HUBOT_GITHUB_REPO
//   HUBOT_GITHUB_USER_(.*)
//   HUBOT_GITHUB_API

// Commands:
//   hubot show [me] [<limit> [of]] [<assignee>'s|my] [<label>] issues [for <user/repo>] [about <query>] -- Shows open GitHub issues for repo.
//   hubot show [me] issues for <repo> -- List all issues for given repo IFF HUBOT_GITHUB_USER configured
//   hubot show [me] issues for <user/repo> -- List all issues for given repo
//   hubot show [me] issues -- Lists all issues IFF HUBOT_GITHUB_REPO configured
//   hubot show <chat user's> issues -- Lists all issues for chat user IFF HUBOT_GITHUB_USER_(.*) configured

// Notes:
//   If, for example, HUBOT_GITHUB_USER_JOHN is set to GitHub user login
//   'johndoe1', you can ask `show john's issues` instead of `show johndoe1's
//   issues`. This is useful for mapping chat handles to GitHub logins.

//   HUBOT_GITHUB_API allows you to set a custom URL path (for Github enterprise users)

// Author:
//   davidsiegel
var ASK_REGEX, _, _s, complete_assignee, filter_issues, parse_criteria;

_ = require("underscore");

_s = require("underscore.string");

ASK_REGEX = /show\s(me)?\s*(\d+|\d+\sof)?\s*(\S+'s|my)?\s*(\S+)?\s*issues\s*(for\s\S+)?\s*(about\s.+)?/i; // Start's with 'show'
// Optional 'me'
// 'N of' -- 'of' is optional but ambiguous unless assignee is named
// Assignee's name or 'my'
// Optional label name
// 'issues'
// Optional 'for <repo>'
// Optional 'about <query>'

// Given the text sent to robot.respond (e.g. 'hubot show me...'), parse the
// criteria used for filtering issues.
parse_criteria = function(message) {
  var assignee, label, limit, me, query, repo;
  [me, limit, assignee, label, repo, query] = message.match(ASK_REGEX).slice(1);
  return {
    me: me,
    limit: limit != null ? parseInt(limit.replace(" of", "")) : void 0,
    assignee: assignee != null ? assignee.replace("'s", "") : void 0,
    label: label,
    repo: repo != null ? repo.replace("for ", "") : void 0,
    query: query != null ? query.replace("about ", "") : void 0
  };
};

// Filter the issue list by criteria; most of the filtering is handled as part
// of the Issues API, but limit and query paramaters are not part of the API.
filter_issues = function(issues, {limit, query}) {
  if (query != null) {
    issues = _.filter(issues, function(i) {
      return _.any([i.body, i.title], function(s) {
        return _s.include(s.toLowerCase(), query.toLowerCase());
      });
    });
  }
  if (limit != null) {
    issues = _.first(issues, limit);
  }
  return issues;
};

// Resolve assignee name to a potential GitHub username using sender
// information and/or environment variables.
complete_assignee = function(msg, name) {
  var resolve;
  if (name === "my") {
    name = msg.message.user.name;
  }
  name = name.replace("@", "");
  // Try resolving the name to a GitHub username using full, then first name:
  resolve = function(n) {
    return process.env[`HUBOT_GITHUB_USER_${n.replace(/\s/g, '_').toUpperCase()}`];
  };
  return resolve(name) || resolve(name.split(' ')[0]) || name;
};

module.exports = function(robot) {
  var github;
  github = require("githubot")(robot);
  return robot.respond(ASK_REGEX, function(msg) {
    var base_url, criteria, query_params;
    criteria = parse_criteria(msg.message.text);
    criteria.repo = github.qualified_repo(criteria.repo);
    if (criteria.assignee != null) {
      criteria.assignee = complete_assignee(msg, criteria.assignee);
    }
    query_params = {
      state: "open",
      sort: "created"
    };
    if (criteria.label != null) {
      query_params.labels = criteria.label;
    }
    if (criteria.assignee != null) {
      query_params.assignee = criteria.assignee;
    }
    base_url = process.env.HUBOT_GITHUB_API || 'https://api.github.com';
    return github.get(`${base_url}/repos/${criteria.repo}/issues`, query_params, function(issues) {
      var assignee, issue, j, label, labels, len, results;
      issues = filter_issues(issues, criteria);
      if (_.isEmpty(issues)) {
        return msg.send("No issues found.");
      } else {
        results = [];
        for (j = 0, len = issues.length; j < len; j++) {
          issue = issues[j];
          labels = ((function() {
            var k, len1, ref, results1;
            ref = issue.labels;
            results1 = [];
            for (k = 0, len1 = ref.length; k < len1; k++) {
              label = ref[k];
              results1.push(`#${label.name}`);
            }
            return results1;
          })()).join(" ");
          assignee = issue.assignee ? ` (${issue.assignee.login})` : "";
          results.push(msg.send(`[${issue.number}] ${issue.title} ${labels}${assignee} = ${issue.html_url}`));
        }
        return results;
      }
    });
  });
};

// require('../../test/scripts/github-issues_test').test parse_criteria
