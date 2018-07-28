// Description:
//   Overloads pagerduty plugin commands to record and display
//   override points for different users.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot pager me <number> - award <number> points to the user
//   hubot pager me points - should current points

// Notes:

// Author:
//   nstielau

// Thanks for brettlangdon and monde for their points plugin:
// https://github.com/github/hubot-scripts/blob/master/src/scripts/points.coffee
var award_points, pager_points, save;

pager_points = {};

award_points = function(msg, username, pts) {
  if (pager_points[username] == null) {
    pager_points[username] = 0;
  }
  return pager_points[username] += parseInt(pts);
};

save = function(robot) {
  return robot.brain.data.pager_points = pager_points;
};

module.exports = function(robot) {
  robot.brain.on('loaded', function() {
    var points;
    return points = robot.brain.data.pager_points || {};
  });
  // Catch override requests, and award points
  robot.respond(/pager( me)? (\d+)/i, function(msg) {
    var email, minutes;
    email = msg.message.user.pagerdutyEmail;
    minutes = parseInt(msg.match[2]);
    award_points(msg, email, minutes);
    return save(robot);
  });
  // Show current point scoreboard
  robot.respond(/pager( me)? points/i, function(msg) {
    var results, user_points, username;
    results = [];
    for (username in pager_points) {
      user_points = pager_points[username];
      if (username && user_points) {
        results.push(msg.send(username + ' has ' + user_points + ' override minutes clocked'));
      } else {
        results.push(void 0);
      }
    }
    return results;
  });
  // DEBUG: helper for testing without the pagerduty plugin
  robot.respond(/pager(?: me)? as (.*) for points/i, function(msg) {
    var email;
    email = msg.match[1];
    if (!msg.message.user.pagerdutyEmail) {
      return msg.message.user.pagerdutyEmail = email;
    }
  });
  // DEBUG: Clear points
  return robot.respond(/pager( me)? clear points/i, function(msg) {
    pager_points = {};
    return save(robot);
  });
};
