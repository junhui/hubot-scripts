// Description:
//   Bees are insane

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   bees - Oprah at her finest, or a good way to turn the fans on coworkers machines

// Author:
//   atmos
module.exports = function(robot) {
  return robot.hear(/bee+s?\b/i, function(message) {
    return message.send("http://i.imgur.com/qrLEV.gif");
  });
};
