// Description
//   Integration with Semaphore (semaphoreapp.com)

// Dependencies:
//   None

// Configuration:
//   HUBOT_SEMAPHOREAPP_TRIGGER
//     Comma-separated list of additional keywords that will trigger
//     this script (e.g., "build")

//   HUBOT_SEMAPHOREAPP_AUTH_TOKEN
//     Your authentication token for Semaphore API

//   HUBOT_SEMAPHOREAPP_NOTIFY_RULES
//     Comma-separated list of rules. A rule consists of a room and an
//     *optional* regular expression separated with a colon (i.e., ':').
//     Right-hand side of a rule is to match branch names, so you can do things
//     like notifying "The Serious Room" for master branch, and discard all other
//     notifications. If you omit right-hand side of a rule then room will
//     be notified for any branch.

//     Note: If you're using the built-in Campfire adapter then a "room" would be
//           one of the Campfire room ids configured in HUBOT_CAMPFIRE_ROOMS.

//     Examples:

//       "The Internal Room"
//         =>  Notifications of any branch go to "The Internal Room".

//       "The Serious Room:master"
//         =>  Notifications of master branch go to "The Serious Room",
//             notifications of other branches will be discarded.

//       "The Serious Room:master,The Internal Room:(?!master).*"
//         =>  Notifications of master branch go to "The Serious Room",
//             notifications of other branches go to "The Internal Room".

//       "The Developers Room:.*(test|experiment).*"
//         =>  Notifications of branches that contain "test" or "experiment"
//             go to "The Developers Room", notifications of other branches
//             will be discarded.

// Commands:
//   hubot semaphoreapp status [<project> [<branch>]] - Reports build status for projects' branches

// URLs:
//   POST /hubot/semaphoreapp
//     First, read http://docs.semaphoreapp.com/webhooks, then your URL to
//     receive the payload would be "<HUBOT_URL>:<PORT>/hubot/semaphoreapp"
//     or if you deployed Hubot onto Heroku: "<HEROKU_URL>/hubot/semaphoreapp".

// Author:
//   exalted
var SemaphoreApp, statusEmoji, statusMessage, tellEitherOneOfThese;

module.exports = function(robot) {
  var trigger;
  if (process.env.HUBOT_SEMAPHOREAPP_TRIGGER) {
    trigger = process.env.HUBOT_SEMAPHOREAPP_TRIGGER.split(',').join('|');
  }
  robot.respond(new RegExp(`(?:semaphoreapp|${trigger})\\s+status(?:\\s+(\\S+)(?:\\s+(\\S+))?)?\\s*$`, "i"), function(msg) {
    var branchName, projectName, semaphoreapp;
    semaphoreapp = new SemaphoreApp(msg);
    // Read parameters
    projectName = msg.match[1];
    branchName = msg.match[2];
    return semaphoreapp.getListOfAllProjects(function(projects) {
      var branch, butTellAlsoThis, i, j, len, len1, names, project, ref, x;
      if (!(projects.length > 0)) {
        msg.reply("I don't know anything really. Sorry. :cry:");
        return;
      }
      // unless projectName
      //   # TODO recall project name for current user
      if (!branchName) {
        branchName = "master";
      }
      if (!projectName) {
        if (projects.length > 1) {
          names = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = projects.length; i < len; i++) {
              x = projects[i];
              results.push(x.name);
            }
            return results;
          })();
          msg.reply(`I want to do so many things, trying to decide, but... :sweat: How about ${tellEitherOneOfThese(names)} instead?`);
          return;
        } else {
          project = projects[0];
        }
      }
      if (project == null) {
        for (i = 0, len = projects.length; i < len; i++) {
          x = projects[i];
          if (x.name === projectName) {
            project = x;
            break;
          }
        }
      }
      if (project == null) {
        if (projects.length > 1) {
          names = (function() {
            var j, len1, results;
            results = [];
            for (j = 0, len1 = projects.length; j < len1; j++) {
              x = projects[j];
              results.push(x.name);
            }
            return results;
          })();
          butTellAlsoThis = `How about ${tellEitherOneOfThese(names)} instead?`;
        } else {
          butTellAlsoThis = `Do you mean "${projects[0].name}" perhaps? :wink:`;
        }
        msg.reply(`I don't know anything about "${projectName}" project. Sorry. :cry: ${butTellAlsoThis}`);
        return;
      }
      // TODO remember last asked project name for current user
      if (!(project.branches.length > 0)) {
        msg.reply(`I can't find no branches for "${projectName}" project. Sorry. :cry:`);
        return;
      }
      ref = project.branches;
      for (j = 0, len1 = ref.length; j < len1; j++) {
        x = ref[j];
        if (x.branch_name === branchName) {
          branch = x;
          break;
        }
      }
      if (branch == null) {
        if (project.branches.length > 1) {
          names = (function() {
            var k, len2, ref1, results;
            ref1 = project.branches;
            results = [];
            for (k = 0, len2 = ref1.length; k < len2; k++) {
              x = ref1[k];
              results.push(x.branch_name);
            }
            return results;
          })();
          butTellAlsoThis = `How about ${tellEitherOneOfThese(names)} instead?`;
        } else {
          butTellAlsoThis = `Do you mean "${project.branches[0].branch_name}" perhaps? :wink:`;
        }
        msg.reply(`I don't know anything about "${branchName}" branch. Sorry. :cry: ${butTellAlsoThis}`);
        return;
      }
      return msg.reply(statusMessage(branch));
    });
  });
  return robot.router.post("/hubot/semaphoreapp", function(req, res) {
    var branch, branchRegExp, error, i, len, message, payload, ref, room, rule, rules, x;
    if (!process.env.HUBOT_SEMAPHOREAPP_NOTIFY_RULES) {
      message = "semaphoreapp hook warning: HUBOT_SEMAPHOREAPP_NOTIFY_RULES is empty.";
      res.send(500, {
        error: message
      });
      console.log(message);
      return;
    }
    try {
      payload = req.body;
    } catch (error1) {
      error = error1;
      message = `semaphoreapp hook error: ${error}. Payload: ${req.body}`;
      res.send(400, message);
      console.log(message);
      return;
    }
    res.send();
    rules = process.env.HUBOT_SEMAPHOREAPP_NOTIFY_RULES.split(',');
    ref = (function() {
      var j, len, results;
      results = [];
      for (j = 0, len = rules.length; j < len; j++) {
        x = rules[j];
        results.push(x.split(':'));
      }
      return results;
    })();
    for (i = 0, len = ref.length; i < len; i++) {
      rule = ref[i];
      room = rule[0];
      branch = rule[1];
      try {
        branchRegExp = new RegExp(branch ? `^${branch}$` : void 0);
      } catch (error1) {
        error = error1;
        console.log(`semaphoreapp error: ${error}.`);
        return;
      }
      if (branchRegExp.test(payload.branch_name)) {
        robot.messageRoom(room, statusMessage(payload));
      }
    }
  });
};

tellEitherOneOfThese = function(things) {
  return `"${things.slice(0, -1).join('\", \"')}" or "${things.slice(-1)}"`;
};

statusEmoji = function(status) {
  switch (status) {
    case "passed":
      return ":white_check_mark:";
    case "failed":
      return ":x:";
    case "pending":
      return ":warning:";
  }
};

statusMessage = function(branch) {
  var authorName, buildURL, message, refSpec, result;
  refSpec = `${branch.project_name}/${branch.branch_name}`;
  result = `${branch.result[0].toUpperCase() + branch.result.slice(1).toLowerCase()}`;
  message = branch.commit ? ` "${(branch.commit.message.split(/\n/)[0])}"` : "";
  authorName = branch.commit ? ` - ${branch.commit.author_name}` : "";
  buildURL = `${branch.build_url}`;
  return `${statusEmoji(branch.result)} [${refSpec}] ${result}:${message}${authorName} (${buildURL})`;
};

SemaphoreApp = class SemaphoreApp {
  constructor(msg) {
    this.msg = msg;
  }

  getListOfAllProjects(callback) {
    if (!process.env.HUBOT_SEMAPHOREAPP_AUTH_TOKEN) {
      this.msg.reply("I am not allowed to access Semaphore APIs, sorry. :cry:");
      return;
    }
    return this.msg.robot.http("https://semaphoreapp.com/api/v1/projects").query({
      auth_token: `${process.env.HUBOT_SEMAPHOREAPP_AUTH_TOKEN}`
    }).get()(function(err, res, body) {
      var error, json;
      try {
        json = JSON.parse(body);
      } catch (error1) {
        error = error1;
        console.log(`semaphoreapp error: ${error}.`);
        this.msg.reply("Semaphore is talking gibberish right now. Try again later?! :confused:");
      }
      return callback(json);
    });
  }

};
