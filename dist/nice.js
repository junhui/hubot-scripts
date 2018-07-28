// Description:
//   Fill your chat with some kindness

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot be nice - just gives some love :)

// Author:
//   nesQuick
var hugs;

hugs = ["You are awesome!", "A laugh is a smile that bursts.", "=)", "Everyone smiles in the same language.", "Thank you for installing me."];

module.exports = function(robot) {
  return robot.respond(/be nice/i, function(message) {
    var rnd;
    rnd = Math.floor(Math.random() * hugs.length);
    return message.send(hugs[rnd]);
  });
};
