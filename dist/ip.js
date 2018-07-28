// Description:
//   Return Hubot's external IP address (via jsonip.com)

// Dependencies:
//   None

// Configuration:
//  None

// Commands:
//   hubot ip - Returns Hubot server's external IP address 

// Author:
//   ndrake
module.exports = function(robot) {
  return robot.respond(/ip/i, function(msg) {
    return msg.http("http://jsonip.com").get()(function(err, res, body) {
      var json;
      json = JSON.parse(body);
      switch (res.statusCode) {
        case 200:
          return msg.send(`External IP address: ${json.ip}`);
        default:
          return msg.send(`There was an error getting external IP (status: ${res.statusCode}).`);
      }
    });
  });
};
