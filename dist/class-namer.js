// Description:
//   Class name generator. Inspired by classnamer.com

// Commands:
//   hubot class me - generates a class name

// Author:
//   ianmurrays

// Dependencies:
//   classnamer gem – Install with `gem install classnamer`
var child_process;

child_process = require('child_process');

module.exports = function(robot) {
  return robot.respond(/class(?: me)?/i, function(msg) {
    return child_process.exec('classnamer', function(error, stdout, stderr) {
      if (error) {
        return msg.send("Sorry, but the classnamer gem is not installed. Install with `gem install classnamer`.");
      } else {
        return msg.send(stdout.trim());
      }
    });
  });
};
