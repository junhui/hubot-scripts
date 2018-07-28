// Description:
//   Get a random commit message

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot commit message - Displays a random commit message

// Author:
//   mrtazz
module.exports = function(robot) {
  return robot.respond(/commit message/i, function(msg) {
    return msg.http("http://whatthecommit.com/index.txt").get()(function(err, res, body) {
      return msg.reply(body);
    });
  });
};
