// Description:
//   Zach Holman hates weasel words. Frick.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   frick - Let Zach Holman tell you what word to use instead of "frick"

// Authors:
//   lmarburger
module.exports = function(robot) {
  return robot.hear(/frick/i, function(msg) {
    return msg.send('https://twitter.com/holman/status/296703339696111617');
  });
};
