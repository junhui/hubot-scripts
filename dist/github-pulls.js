// Description:
//   Show open pull requests from a Github repository or organization

// Dependencies:
//   "githubot": "0.4.x"

// Configuration:
//   HUBOT_GITHUB_TOKEN
//   HUBOT_GITHUB_USER
//   HUBOT_GITHUB_API
//   HUBOT_GITHUB_ORG

// Commands:
//   hubot show [me] <user/repo> pulls [with <regular expression>] -- Shows open pull requests for that project by filtering pull request's title.
//   hubot show [me] <repo> pulls -- Show open pulls for HUBOT_GITHUB_USER/<repo>, if HUBOT_GITHUB_USER is configured
//   hubot show [me] org-pulls [for <organization>] -- Show open pulls for all repositories of an organization, default is HUBOT_GITHUB_ORG

// Notes:
//   HUBOT_GITHUB_API allows you to set a custom URL path (for Github enterprise users)

//   You can further filter pull request title by providing a regular expression.
//   For example, `show me hubot pulls with awesome fix`.

// Author:
//   jingweno
module.exports = function(robot) {
  var github, url_api_base;
  github = require("githubot")(robot);
  if ((url_api_base = process.env.HUBOT_GITHUB_API) == null) {
    url_api_base = "https://api.github.com";
  }
  robot.respond(/show\s+(me\s+)?(.*)\s+pulls(\s+with\s+)?(.*)?/i, function(msg) {
    var filter_reg_exp, repo;
    repo = github.qualified_repo(msg.match[2]);
    if (msg.match[3]) {
      filter_reg_exp = new RegExp(msg.match[4], "i");
    }
    return github.get(`${url_api_base}/repos/${repo}/pulls`, function(pulls) {
      var filtered_result, i, j, len, len1, pull, summary;
      if (pulls.length === 0) {
        summary = "Achievement unlocked: open pull requests zero!";
      } else {
        filtered_result = [];
        for (i = 0, len = pulls.length; i < len; i++) {
          pull = pulls[i];
          if (filter_reg_exp && pull.title.search(filter_reg_exp) < 0) {
            continue;
          }
          filtered_result.push(pull);
        }
        if (filtered_result.length === 0) {
          summary = `There's no open pull request for ${repo} matching your filter!`;
        } else if (filtered_result.length === 1) {
          summary = `There's only one open pull request for ${repo}:`;
        } else {
          summary = `I found ${filtered_result.length} open pull requests for ${repo}:`;
        }
        for (j = 0, len1 = filtered_result.length; j < len1; j++) {
          pull = filtered_result[j];
          summary = summary + `\n\t${pull.title} - ${pull.user.login}: ${pull.html_url}`;
        }
      }
      return msg.send(summary);
    });
  });
  return robot.respond(/show\s+(me\s+)?org\-pulls(\s+for\s+)?(.*)?/i, function(msg) {
    var org_name, url;
    org_name = msg.match[3] || process.env.HUBOT_GITHUB_ORG;
    if (!org_name) {
      msg.send("No organization specified, please provide one or set HUBOT_GITHUB_ORG accordingly.");
      return;
    }
    url = `${url_api_base}/orgs/${org_name}/issues?filter=all&state=open&per_page=100`;
    return github.get(url, function(issues) {
      var filtered_result, i, issue, j, len, len1, summary;
      if (issues.length === 0) {
        summary = "Achievement unlocked: open pull requests zero!";
      } else {
        filtered_result = [];
        for (i = 0, len = issues.length; i < len; i++) {
          issue = issues[i];
          if (issue.pull_request != null) {
            filtered_result.push(issue);
          }
        }
        if (filtered_result.length === 0) {
          summary = "Achievement unlocked: open pull requests zero!";
        } else if (filtered_result.length === 1) {
          summary = `There's only one open pull request for ${org_name}:`;
        } else {
          summary = `I found ${filtered_result.length} open pull requests for ${org_name}:`;
        }
        for (j = 0, len1 = filtered_result.length; j < len1; j++) {
          issue = filtered_result[j];
          summary = summary + `\n\t${issue.repository.name}: ${issue.title} (${issue.user.login}) -> ${issue.pull_request.html_url}`;
        }
      }
      return msg.send(summary);
    });
  });
};
