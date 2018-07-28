// Description:
//   Help decide between two things

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot throw a coin - Gives you heads or tails

// Author:
//   mrtazz
var thecoin;

thecoin = ["heads", "tails"];

module.exports = function(robot) {
  return robot.respond(/(throw|flip|toss) a coin/i, function(msg) {
    return msg.reply(msg.random(thecoin));
  });
};
