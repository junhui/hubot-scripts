// Description:
//   None

// Dependencies:
//   "querystring": "0.1.0"

// Configuration:
//   None

// Commands:
//   hubot erl <expr> - Evaluate an Erlang Expression on tryerlang.org and return the result

// Author:
//   Roberto Aloi (@robertoaloi)
var QS;

QS = require("querystring");

module.exports = function(robot) {
  return robot.respond(/(tryerlang|erl) (.*)/i, function(msg) {
    var data, expr;
    expr = msg.match[2];
    data = QS.stringify({
      'expression': expr
    });
    return msg.http('http://www.tryerlang.org/api/eval/default/intro').post(data)(function(err, res, body) {
      var response;
      response = JSON.parse(body);
      return msg.send(response.result);
    });
  });
};
