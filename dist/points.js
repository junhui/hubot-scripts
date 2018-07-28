// Description:
//   Give, Take and List User Points

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot give <number> points to <username> - award <number> points to <username>
//   hubot give <username> <number> points - award <number> points to <username>
//   hubot take <number> points from <username> - take away <number> points from <username>
//   hubot how many points does <username> have? - list how many points <username> has
//   hubot take all points from <username> - removes all points from <username>

// Author:
//   brettlangdon

var award_points, points, save;

points = {};

award_points = function(msg, username, pts) {
  if (points[username] == null) {
    points[username] = 0;
  }
  points[username] += parseInt(pts);
  return msg.send(pts + ' Awarded To ' + username);
};

save = function(robot) {
  return robot.brain.data.points = points;
};

module.exports = function(robot) {
  robot.brain.on('loaded', function() {
    return points = robot.brain.data.points || {};
  });
  robot.respond(/give (\d+) points to (.*?)\s?$/i, function(msg) {
    award_points(msg, msg.match[2], msg.match[1]);
    return save(robot);
  });
  robot.respond(/give (.*?) (\d+) points/i, function(msg) {
    award_points(msg, msg.match[1], msg.match[2]);
    return save(robot);
  });
  robot.respond(/take all points from (.*?)\s?$/i, function(msg) {
    var username;
    username = msg.match[1];
    points[username] = 0;
    msg.send(username + ' WHAT DID YOU DO?!');
    return save(robot);
  });
  robot.respond(/take (\d+) points from (.*?)\s?$/i, function(msg) {
    var pts, username;
    pts = msg.match[1];
    username = msg.match[2];
    if (points[username] == null) {
      points[username] = 0;
    }
    if (points[username] === 0) {
      msg.send(username + ' Does Not Have Any Points To Take Away');
    } else {
      points[username] -= parseInt(pts);
      msg.send(pts + ' Points Taken Away From ' + username);
    }
    return save(robot);
  });
  return robot.respond(/how many points does (.*?) have\??/i, function(msg) {
    var username;
    username = msg.match[1];
    if (points[username] == null) {
      points[username] = 0;
    }
    return msg.send(username + ' Has ' + points[username] + ' Points');
  });
};
