// Description:
//   Evaluate one line of Ruby script

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot ruby|rb <script> - Evaluate one line of Ruby script

// Author:
//   jingweno
module.exports = function(robot) {
  return robot.respond(/(ruby|rb)\s+(.*)/i, function(msg) {
    var script;
    script = msg.match[2];
    return msg.http("http://tryruby.org/levels/1/challenges/0").query({
      "cmd": script
    }).headers({
      "Content-Length": "0"
    }).put()(function(err, res, body) {
      var result;
      switch (res.statusCode) {
        case 200:
          result = JSON.parse(body);
          if (result.success) {
            return msg.reply(result.output);
          } else {
            return msg.reply(result.result);
          }
          break;
        default:
          return msg.reply(`Unable to evaluate script: ${script}. Request returned with the status code: ${res.statusCode}`);
      }
    });
  });
};
