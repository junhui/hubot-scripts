// Description:
//   Listens for Trajectory story and idea links.

// Dependencies:
//   None

// Configuration:
//   HUBOT_TRAJECTORY_APIKEY: your Trajectory API key
//   HUBOT_TRAJECTORY_ACCOUNT: your Trajectory account number

// Commands:
//   <a Trajectory story or idea URL> - sends back some details

// Author:
//   galfert
module.exports = function(robot) {
  return robot.hear(/apptrajectory\.com\/\w+\/(\w+)\/(stories|ideas)\/(\d+)/i, function(msg) {
    var account, apiKey, baseURL, detailsURL, elementId, elementType, project;
    apiKey = process.env.HUBOT_TRAJECTORY_APIKEY;
    account = process.env.HUBOT_TRAJECTORY_ACCOUNT;
    if (!(apiKey && account)) {
      msg.send("Please set HUBOT_TRAJECTORY_APIKEY and HUBOT_TRAJECTORY_ACCOUNT correctly");
      return;
    }
    project = msg.match[1];
    elementType = msg.match[2];
    elementId = parseInt(msg.match[3], 10);
    baseURL = `https://www.apptrajectory.com/api/${apiKey}/accounts/${account}/projects/${project}`;
    detailsURL = {
      "stories": `${baseURL}/stories/${elementId}.json`,
      "ideas": `${baseURL}/ideas.json`
    }[elementType];
    return msg.http(detailsURL).get()(function(err, res, body) {
      var details, i, idea, len, message;
      if (err) {
        msg.send(`Trajectory says: ${err}`);
        return;
      }
      if (res.statusCode !== 200) {
        msg.send(`Got me a code ${res.statusCode}`);
        return;
      }
      details = JSON.parse(body);
      if (elementType === 'stories') {
        message = `"${details.title}"`;
        if (details.assignee_name) {
          message += `, assigned to ${details.assignee_name}`;
        }
        message += ` (${details.state} ${details.task_type.toLowerCase()})`;
        return msg.send(message);
      } else if (elementType === 'ideas') {
        for (i = 0, len = details.length; i < len; i++) {
          idea = details[i];
          if (idea.id === elementId) {
            message = `"${idea.subject}"`;
            if (idea.user) {
              message += `, created by ${idea.user.name}`;
            }
            message += ` (${idea.state})`;
            msg.send(message);
            return;
          }
        }
        return msg.send("I've got no idea what you are talking about");
      }
    });
  });
};
