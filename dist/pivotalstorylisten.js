// Description:
//   Listen for a specific story from PivotalTracker

// Dependencies:
//   None

// Configuration:
//   HUBOT_PIVOTAL_TOKEN

// Commands:
//   paste a pivotal tracker link or type "sid-####" in the presence of hubot

// Author:
//   christianchristensen
module.exports = function(robot) {
  return robot.hear(/(sid-|SID-|pivotaltracker.com\/story\/show)/i, function(msg) {
    var story_id, token;
    token = process.env.HUBOT_PIVOTAL_TOKEN;
    story_id = msg.message.text.match(/\d+$/); // look for some numbers in the string
    return msg.http("https://www.pivotaltracker.com/services/v5/projects").headers({
      "X-TrackerToken": token
    }).get()(function(err, res, body) {
      var e, i, len, project, projects, results;
      if (err) {
        return msg.send(`Pivotal says: ${err}`);
      }
      try {
        projects = JSON.parse(body);
      } catch (error) {
        e = error;
        return msg.send(`Error parsing pivotal projects body: ${e}`);
      }
      results = [];
      for (i = 0, len = projects.length; i < len; i++) {
        project = projects[i];
        results.push(msg.http(`https://www.pivotaltracker.com/services/v5/projects/${project.id}/stories/${story_id}`).headers({
          "X-TrackerToken": token
        }).get()(function(err, res, body) {
          var message, story;
          if (err) {
            return msg.send(`Pivotal says: ${err}`);
          }
          if (res.statusCode === 404) { // No story found in this project
            return;
          }
          try {
            story = JSON.parse(body);
          } catch (error) {
            e = error;
            return msg.send(`Error parsing pivotal story body: ${e}`);
          }
          message = `#${story.id} ${story.name}`;
          if (story.current_state && story.current_state !== "unstarted") {
            message += ` is ${story.current_state}`;
          }
          return msg.send(message);
        }));
      }
      return results;
    });
  });
};
