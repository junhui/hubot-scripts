// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot nettipot - Send scarring, horrifying image of a nettipot in use.

// Author
//   alexpgates
var nettipot;

nettipot = "http://i.imgur.com/EIqdZ.gif";

module.exports = function(robot) {
  robot.respond(/nettipot/i, function(msg) {
    return msg.send(nettipot);
  });
  return robot.respond(/nettibomb/i, function(msg) {
    msg.send(nettipot);
    msg.send(nettipot);
    msg.send(nettipot);
    msg.send(nettipot);
    return msg.send(nettipot);
  });
};
