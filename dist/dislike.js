// Description:
//   Grumpy cat dislike this >:[

// Dependencies:
//   None

// Configuration:
//   None

// Commands:

// Author:
//   nesQuick
module.exports = function(robot) {
  return robot.hear(/dislike/i, function(msg) {
    return msg.send("https://pbs.twimg.com/media/BFV2RuQCUAArpAs.jpg");
  });
};
