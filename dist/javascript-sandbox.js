// Description:
//   sandbox - run javascript in a sandbox!

// Dependencies:
//   "sandbox": "0.8.3"

// Configuration:
//   None

// Commands:
//   hubot (run|sandbox) <javascript> - Execute the javascript code

// Author:
//   ajacksified
var Sandbox;

Sandbox = require('sandbox');

module.exports = function(robot) {
  return robot.respond(/(run|sandbox|js) (.*)/i, function(msg) {
    var sandbox;
    sandbox = new Sandbox;
    return sandbox.run(msg.match[2], function(output) {
      return msg.send(output.result);
    });
  });
};
