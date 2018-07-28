// Description:
//   Get current stories from PivotalTracker

// Dependencies:
//   "xml2js": "0.1.14"

// Configuration:
//   HUBOT_PIVOTAL_TOKEN
//   HUBOT_PIVOTAL_PROJECT

// Commands:
//   show me stories for <project> - shows current stories being worked on
//   pivotal story <story_id> - shows story title, owner and status

// Author:
//   assaf
var Parser;

Parser = require("xml2js").Parser;

module.exports = function(robot) {
  robot.respond(/show\s+(me\s+)?stories(\s+for\s+)?(.*)/i, function(msg) {
    var project_name, token;
    token = process.env.HUBOT_PIVOTAL_TOKEN;
    project_name = msg.match[3];
    if (project_name === "") {
      project_name = RegExp(process.env.HUBOT_PIVOTAL_PROJECT, "i");
    } else {
      project_name = RegExp(project_name + ".*", "i");
    }
    return msg.http("http://www.pivotaltracker.com/services/v3/projects").headers({
      "X-TrackerToken": token
    }).get()(function(err, res, body) {
      if (err) {
        msg.send(`Pivotal says: ${err}`);
        return;
      }
      return (new Parser).parseString(body, function(err, json) {
        var i, len, project, ref;
        ref = json.project;
        for (i = 0, len = ref.length; i < len; i++) {
          project = ref[i];
          if (project_name.test(project.name)) {
            msg.http(`https://www.pivotaltracker.com/services/v3/projects/${project.id}/iterations/current`).headers({
              "X-TrackerToken": token
            }).query({
              filter: "state:unstarted,started,finished,delivered"
            }).get()(function(err, res, body) {
              if (err) {
                msg.send(`Pivotal says: ${err}`);
                return;
              }
              return (new Parser).parseString(body, function(err, json) {
                var j, len1, message, ref1, results, story;
                ref1 = json.iteration.stories.story;
                results = [];
                for (j = 0, len1 = ref1.length; j < len1; j++) {
                  story = ref1[j];
                  message = `#${story.id['#']} ${story.name}`;
                  if (story.owned_by) {
                    message += ` (${story.owned_by})`;
                  }
                  if (story.current_state && story.current_state !== "unstarted") {
                    message += ` is ${story.current_state}`;
                  }
                  results.push(msg.send(message));
                }
                return results;
              });
            });
            return;
          }
        }
        return msg.send(`No project ${project_name}`);
      });
    });
  });
  return robot.respond(/(pivotal story)? (.*)/i, function(msg) {
    var project_id, story_id, token;
    token = process.env.HUBOT_PIVOTAL_TOKEN;
    project_id = process.env.HUBOT_PIVOTAL_PROJECT;
    story_id = msg.match[2];
    msg.http("http://www.pivotaltracker.com/services/v3/projects").headers({
      "X-TrackerToken": token
    }).get()(function(err, res, body) {
      if (err) {
        msg.send(`Pivotal says: ${err}`);
        return;
      }
      return (new Parser).parseString(body, function(err, json) {
        var i, len, project, ref, results;
        ref = json.project;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          project = ref[i];
          results.push(msg.http(`https://www.pivotaltracker.com/services/v3/projects/${project.id}/stories/${story_id}`).headers({
            "X-TrackerToken": token
          }).get()(function(err, res, body) {
            if (err) {
              msg.send(`Pivotal says: ${err}`);
              return;
            }
            if (res.statusCode !== 500) {
              return (new Parser).parseString(body, function(err, story) {
                var message, storyReturned;
                if (!story.id) {
                  return;
                }
                message = `#${story.id['#']} ${story.name}`;
                if (story.owned_by) {
                  message += ` (${story.owned_by})`;
                }
                if (story.current_state && story.current_state !== "unstarted") {
                  message += ` is ${story.current_state}`;
                }
                msg.send(message);
                storyReturned = true;
              });
            }
          }));
        }
        return results;
      });
    });
  });
};
