// Description:
//   http://xkcd.com/1009/

// Dependencies:
//   None

// Configuration:
//   None

// Commands:

// Author:
//   eighnjel
module.exports = function(robot) {
  var sigh_counter;
  sigh_counter = 0;
  return robot.hear(/(^|\W)[s]+[i]+[g]+[h]+(\z|\W|$)/i, function(msg) {
    if (sigh_counter === 3) {
      sigh_counter = 0;
      return msg.send("I work out");
    } else {
      sigh_counter += 1;
      return msg.send("Girl look at that body");
    }
  });
};
