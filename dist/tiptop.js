// Description:
//   Hubot, be Swissy and enjoy team exults.
//   Whenever TIP TOP or TOP is being said Hubot will reply back.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   None

// Notes:
//   Consecutive hops will be ignored.

// Author:
//   matteoagosti
module.exports = function(robot) {
  return robot.hear(/.+/i, function(msg) {
    if (!(msg.message.text === "TOP" || msg.message.text === "TIP TOP")) {
      robot.brain.data.tiptop = null;
      return;
    }
    if (robot.brain.data.tiptop !== null) {
      return;
    }
    msg.send(msg.message.text);
    return robot.brain.data.tiptop = true;
  });
};
