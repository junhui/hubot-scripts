// Description:
//   Set Hubot environent varibales.
//   Limited to HUBOT_* for security.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot setenv HUBOT_AWESOME true - set the environment variable HUBOT_AWESOME to true
//   hubot getenv HUBOT_AWESOME      - return the value of the environment variable HUBOT_AWESOME

// Author:
//   pepijndevos
module.exports = function(robot) {
  robot.respond(/setenv (HUBOT_[A-Z_]+) (.*)/, function(msg) {
    var env, val;
    env = msg.match[1];
    val = msg.match[2];
    process.env[env] = val;
    return msg.reply("Setting " + env + " to " + val + ".");
  });
  return robot.respond(/getenv (HUBOT_[A-Z_]+)/, function(msg) {
    return msg.reply(process.env[msg.match[1]]);
  });
};
