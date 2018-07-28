// Description:
//   Display a random image of Scotch

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   scotch me - supply a user with scotch

// Author:
//   fusion94
var scotch;

scotch = ["https://s3.amazonaws.com/scotch-assets/scotch_1.jpg", "https://s3.amazonaws.com/scotch-assets/scotch_2.jpg", "https://s3.amazonaws.com/scotch-assets/scotch_3.jpg", "https://s3.amazonaws.com/scotch-assets/scotch_4.jpg", "https://s3.amazonaws.com/scotch-assets/scotch_5.jpg"];

module.exports = function(robot) {
  return robot.hear(/scotch ?me/i, function(msg) {
    return msg.send(msg.random(scotch));
  });
};
