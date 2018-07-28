// Description:
//   EXPERIENCE BIJ

// Dependencies:
//   None

// Configuration:
//   None

// Commands:

// Author:
//   mrtazz
module.exports = function(robot) {
  return robot.hear(/bij/i, function(msg) {
    return msg.send("EXPERIENCE BIJ!");
  });
};
