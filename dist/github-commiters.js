// Description:
//   Show the commiters from a repo

// Dependencies:
//   "githubot": "0.4.x"

// Configuration:
//   HUBOT_GITHUB_TOKEN
//   HUBOT_GITHUB_API

// Commands:
//   hubot repo commiters <repo> - shows commiters of repository
//   hubot repo top-commiters <repo> - shows top commiters of repository

// Notes:
//   HUBOT_GITHUB_API allows you to set a custom URL path (for Github enterprise users)

// Author:
//   vquaiato
module.exports = function(robot) {
  var github, read_contributors;
  github = require("githubot")(robot);
  robot.respond(/repo commiters (.*)$/i, function(msg) {
    return read_contributors(msg, function(commits) {
      var commit, i, len, max_length;
      max_length = commits.length;
      if (commits.length > 20) {
        max_length = 20;
      }
      for (i = 0, len = commits.length; i < len; i++) {
        commit = commits[i];
        msg.send(`[${commit.login}] ${commit.contributions}`);
        max_length -= 1;
        if (!max_length) {
          return;
        }
      }
    });
  });
  robot.respond(/repo top-commiters? (.*)$/i, function(msg) {
    return read_contributors(msg, function(commits) {
      var commit, i, len, top_commiter;
      top_commiter = null;
      for (i = 0, len = commits.length; i < len; i++) {
        commit = commits[i];
        if (top_commiter === null) {
          top_commiter = commit;
        }
        if (commit.contributions > top_commiter.contributions) {
          top_commiter = commit;
        }
      }
      return msg.send(`[${top_commiter.login}] ${top_commiter.contributions} :trophy:`);
    });
  });
  return read_contributors = function(msg, response_handler) {
    var base_url, repo, url;
    repo = github.qualified_repo(msg.match[1]);
    base_url = process.env.HUBOT_GITHUB_API || 'https://api.github.com';
    url = `${base_url}/repos/${repo}/contributors`;
    return github.get(url, function(commits) {
      if (commits.message) {
        return msg.send(`Achievement unlocked: [NEEDLE IN A HAYSTACK] repository ${commits.message}!`);
      } else if (commits.length === 0) {
        return msg.send("Achievement unlocked: [LIKE A BOSS] no commits found!");
      } else {
        if (process.env.HUBOT_GITHUB_API) {
          base_url = base_url.replace(/\/api\/v3/, '');
        }
        msg.send(`${base_url}/${repo}`);
        return response_handler(commits);
      }
    });
  };
};
