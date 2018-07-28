// Description:
//   Ed Balls

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   Ed Balls - Ed Balls

// Author:
//   @pikesley
module.exports = function(robot) {
  return robot.hear(/Ed Balls/i, function(msg) {
    return msg.send("Ed Balls");
  });
};
