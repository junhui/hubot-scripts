// Description:
//   Display GitHub zen message from https://api.github.com/zen API

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   zen - Display GitHub zen message

// Author:
//   anildigital

module.exports = function(robot) {
  return robot.hear(/\bzen\b/i, function(msg) {
    return msg.http("https://api.github.com/zen").get()(function(err, res, body) {
      return msg.send(body);
    });
  });
};
