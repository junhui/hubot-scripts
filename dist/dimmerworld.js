// Description:
//  "Your very own Dimmerworld simulator."

// Dependencies:
//  "cleverbot-node": "0.1.1"

// Configuration:
//   None

// Commands:
//   dimmer <input>

// Author:
//   zachlatta
var dimmer;

dimmer = require('cleverbot-node');

module.exports = function(robot) {
  var d;
  d = new dimmer();
  return robot.respond(/^dimmer/i, function(msg) {
    var data;
    data = msg.match[1].trim();
    return d.write(data, (d) => {
      return msg.send(d.message);
    });
  });
};
