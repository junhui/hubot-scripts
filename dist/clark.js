// Description:
//   None

// Dependencies:
//   "clark": "0.0.5"

// Configuration:
//   None

// Commands:
//   hubot clark <data> - build sparklines out of data

// Author:
//   ajacksified
var clark;

clark = require('clark');

module.exports = function(robot) {
  return robot.respond(/clark (.*)/i, function(msg) {
    var data;
    data = msg.match[1].trim().split(' ');
    return msg.send(clark(data));
  });
};
