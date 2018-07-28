// Description:
//   Post gitlab related events using gitlab hooks

// Dependencies:
//   "url" : ""
//   "querystring" : ""

// Configuration:
//   GITLAB_CHANNEL
//   GITLAB_DEBUG

//   Put http://<HUBOT_URL>:<PORT>/gitlab/system as your system hook
//   Put http://<HUBOT_URL>:<PORT>/gitlab/web as your web hook (per repository)
//   You can also append "?targets=%23room1,%23room2" to the URL to control the
//   message destination.  Using the "target" parameter to override the
//   GITLAB_CHANNEL configuration value.

// Commands:
//   None

// URLS:
//   /gitlab/system
//   /gitlab/web

// Author:
//   omribahumi
var querystring, url;

url = require('url');

querystring = require('querystring');

module.exports = function(robot) {
  var bold, debug, gitlabChannel, handler, trim_commit_url, underline;
  gitlabChannel = process.env.GITLAB_CHANNEL || "#gitlab";
  debug = process.env.GITLAB_DEBUG != null;
  if (robot.adapter.constructor.name === 'IrcBot') {
    bold = function(text) {
      return "\x02" + text + "\x02";
    };
    underline = function(text) {
      return "\x1f" + text + "\x1f";
    };
  } else {
    bold = function(text) {
      return text;
    };
    underline = function(text) {
      return text;
    };
  }
  trim_commit_url = function(url) {
    return url.replace(/(\/[0-9a-f]{9})[0-9a-f]+$/, '$1');
  };
  handler = function(type, req, res) {
    var branch, hook, message, query, user;
    query = querystring.parse(url.parse(req.url).query);
    hook = req.body;
    if (debug) {
      console.log('query', query);
      console.log('hook', hook);
    }
    user = {};
    user.room = query.targets ? query.targets : gitlabChannel;
    if (query.type) {
      user.type = query.type;
    }
    switch (type) {
      case "system":
        switch (hook.event_name) {
          case "project_create":
            return robot.send(user, `Yay! New gitlab project ${bold(hook.name)} created by ${bold(hook.owner_name)} (${bold(hook.owner_email)})`);
          case "project_destroy":
            return robot.send(user, `Oh no! ${bold(hook.owner_name)} (${bold(hook.owner_email)}) deleted the ${bold(hook.name)} project`);
          case "user_add_to_team":
            return robot.send(user, `${bold(hook.project_access)} access granted to ${bold(hook.user_name)} (${bold(hook.user_email)}) on ${bold(hook.project_name)} project`);
          case "user_remove_from_team":
            return robot.send(user, `${bold(hook.project_access)} access revoked from ${bold(hook.user_name)} (${bold(hook.user_email)}) on ${bold(hook.project_name)} project`);
          case "user_create":
            return robot.send(user, `Please welcome ${bold(hook.name)} (${bold(hook.email)}) to Gitlab!`);
          case "user_destroy":
            return robot.send(user, `We will be missing ${bold(hook.name)} (${bold(hook.email)}) on Gitlab`);
        }
        break;
      case "web":
        message = "";
        // is it code being pushed?
        if (hook.ref) {
          branch = hook.ref.split("/").slice(2).join("/");
          // if the ref before the commit is 00000, this is a new branch
          if (/^0+$/.test(hook.before)) {
            message = `${bold(hook.user_name)} pushed a new branch (${bold(branch)}) to ${bold(hook.repository.name)} ${underline(hook.repository.homepage)}`;
          } else {
            message = `${bold(hook.user_name)} pushed to ${branch} at ${hook.repository.name} ${underline(hook.repository.homepage + '/compare/' + hook.before.substr(0, 9) + '...' + hook.after.substr(0, 9))}`;
            message += "\n" + hook.commits.map(function(commit) {
              return commit.message;
            }).join("\n");
          }
          return robot.send(user, message);
        } else {
          // not code? must be a something good!
          switch (hook.object_kind) {
            case "issue":
              robot.send(user, `Issue ${bold(hook.object_attributes.iid)}: ${hook.object_attributes.title} (${hook.object_attributes.state}) at ${hook.object_attributes.url}`);
              break;
            case "merge_request":
              robot.send(user, `Merge Request ${bold(hook.object_attributes.iid)}: ${hook.object_attributes.title} (${hook.object_attributes.state}) between ${bold(hook.object_attributes.source_branch)} and ${bold(hook.object_attributes.target_branch)}`);
          }
          if (hook.object_attributes.description) {
            return robot.send(user, `>> ${hook.object_attributes.description}`);
          }
        }
    }
  };
  robot.router.post("/gitlab/system", function(req, res) {
    handler("system", req, res);
    return res.end("");
  });
  return robot.router.post("/gitlab/web", function(req, res) {
    handler("web", req, res);
    return res.end("");
  });
};
