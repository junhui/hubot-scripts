// Description:
//   I'm going to get you, sucka

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   git - hubot says 'ima git you sucka'

// Author:
//   samn
module.exports = function(robot) {
  return robot.hear(/\bgit\b/, function(msg) {
    if (Math.random() < 0.1) {
      return msg.reply('ima git you sucka');
    }
  });
};
