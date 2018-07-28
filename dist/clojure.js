// Description:
//   Evaluate one line of Clojure script

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot clojure|clj <script> - Evaluate one line of Clojure script

// Author:
//   jingweno
var ringSessionID;

ringSessionID = '';

module.exports = function(robot) {
  return robot.respond(/(clojure|clj)\s+(.*)/i, function(msg) {
    var script;
    script = msg.match[2];
    return msg.http("http://www.tryclj.com/eval.json").query({
      expr: script
    }).headers({
      Cookie: `ring-session=${ringSessionID}`
    }).get()(function(err, res, body) {
      var i, len, output, outputs, result, results;
      switch (res.statusCode) {
        case 200:
          if (res.headers["set-cookie"]) {
            ringSessionID = res.headers["set-cookie"][0].match(/ring-session=([-a-z0-9]+);/)[1];
          }
          result = JSON.parse(body);
          if (result.error) {
            return msg.reply(result.message);
          } else {
            outputs = result.result.split("\n");
            results = [];
            for (i = 0, len = outputs.length; i < len; i++) {
              output = outputs[i];
              results.push(msg.reply(output));
            }
            return results;
          }
          break;
        default:
          return msg.reply(`Unable to evaluate script: ${script}. Request returned with the status code: ${res.statusCode}`);
      }
    });
  });
};
