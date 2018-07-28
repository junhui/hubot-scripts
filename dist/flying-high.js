// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   None

// Commands:

// Author:
//   harukizaemon
module.exports = function(robot) {
  robot.hear(/surely you/i, function(msg) {
    return msg.reply("I am, and don't call me Shirley.");
  });
  robot.hear(/I can'?t .* tell/i, function(msg) {
    return msg.reply("You can tell me. I'm a doctor.");
  });
  robot.hear(/I('?ve| have) never/i, function(msg) {
    return msg.reply("You ever seen a grown man naked?");
  });
  return robot.hear(/hospital\?/i, function(msg) {
    return msg.reply("It's a big building with patients, but that's not important right now.");
  });
};
