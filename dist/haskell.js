// Description:
//   Evaluate one line of Haskell

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot haskell <script> - Evaluate one line of Haskell

// Author:
//   edwardgeorge, slightly modified from code by jingweno
var HASKELLJSON;

HASKELLJSON = "";

module.exports = function(robot) {
  return robot.respond(/(haskell)\s+(.*)/i, function(msg) {
    var script;
    script = msg.match[2];
    return msg.http("http://tryhaskell.org/haskell.json").query({
      method: "eval",
      expr: script
    }).headers({
      Cookie: `HASKELLJSON=${HASKELLJSON}`
    }).get()(function(err, res, body) {
      var i, len, output, outputs, result;
      switch (res.statusCode) {
        case 200:
          if (res.headers["set-cookie"]) {
            HASKELLJSON = res.headers["set-cookie"][0].match(/HASKELLJSON=([-a-z0-9]+);/)[1];
          }
          result = JSON.parse(body);
          if (result.error) {
            return msg.reply(result.error);
          } else {
            if (result.result) {
              outputs = result.result.split("\n");
              for (i = 0, len = outputs.length; i < len; i++) {
                output = outputs[i];
                msg.reply(output);
              }
            }
            return msg.reply(result.type);
          }
          break;
        default:
          return msg.reply(`Unable to evaluate script: ${script}. Request returned with the status code: ${res.statusCode}`);
      }
    });
  });
};
