// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   None

// Commands:

// Author:
//   cgarvis
module.exports = function(robot) {
  return robot.hear(/^(sweet|dude)!/i, function(msg) {
    switch (msg.match[1].toLowerCase()) {
      case "sweet":
        return msg.send("Dude!");
      case "dude":
        return msg.send("Sweet!");
    }
  });
};
