// Description:
//   Forces hubot to do what you want, even if he doesn't know how

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot sudo <anything you want> - Force hubot to do what you want

// Author:
//   searls
module.exports = function(robot) {
  return robot.respond(/(?:sudo) ?(.*)/i, function(msg) {
    var ref;
    return msg.send(`Alright. I'll ${((ref = msg.match) != null ? ref[1] : void 0) || "do whatever it is you wanted."}`);
  });
};
