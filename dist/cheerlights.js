// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot cheerlights - get last color from http://www.cheerlights.com

// Author:
//   marciotoshio
module.exports = function(robot) {
  return robot.respond(/cheerlights/i, function(msg) {
    return msg.http("http://api.thingspeak.com/channels/1417/field/1/last.json").get()(function(err, res, body) {
      var response;
      response = JSON.parse(body);
      if (response) {
        return msg.send("The last color is: " + response["field1"]);
      } else {
        return msg.send("Error");
      }
    });
  });
};
