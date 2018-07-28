// Description:
//   "Makes your Hubot even more Clever™"

// Dependencies:
//   "cleverbot-node": "0.2.1"

// Configuration:
//   None

// Commands:
//   hubot c <input>

// Author:
//   ajacksified
//   Stephen Price <steeef@gmail.com>
var cleverbot;

cleverbot = require('cleverbot-node');

module.exports = function(robot) {
  var c;
  c = new cleverbot();
  return robot.respond(/c (.*)/i, function(msg) {
    var data;
    data = msg.match[1].trim();
    return cleverbot.prepare((function() {
      return c.write(data, (c) => {
        return msg.send(c.message);
      });
    }));
  });
};
