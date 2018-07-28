// Description
//   An HTTP listener for FastSpring payment notifications

// Dependencies:
//   None

// Configuration:
//   HUBOT_FASTSPRING_PRIVATE_KEY

// Commands:
//   None

// URLS:
//   POST /hubot/fastspring
//     room=<room>
//     fullName=<customer's full name>
//     email=<customer's email>
//     productName=<product name, can also be an array of products>
//     totalPriceValue=<total price value>
//     totalPriceCurrency=<total price currency>
//     url=<invoice's url>

// Notes:
//   See FastSpring notifications overview for further details
//   https://support.fastspring.com/entries/236490-Notifications-Overview

// Author:
//   matteoagosti
var crypto, http, querystring;

http = require("http");

querystring = require("querystring");

crypto = require("crypto");

module.exports = function(robot) {
  var privateKey;
  privateKey = process.env.HUBOT_FASTSPRING_PRIVATE_KEY;
  if (!privateKey) {
    robot.logger.error("Please set the HUBOT_FASTSPRING_PRIVATE_KEY environment variable.");
    return;
  }
  return robot.router.post("/hubot/fastspring", function(req, res) {
    var query;
    query = req.body;
    res.end;
    if (!query.room) {
      return;
    }
    if (crypto.createHash("md5").update(query.security_data + privateKey, 'utf8').digest('hex') !== query.security_hash) {
      return;
    }
    return robot.messageRoom(query.room, `${query.fullName} (${query.email}) just bought ${query.productName} for ${query.totalPriceValue}${query.totalPriceCurrency}. ${query.url}`);
  });
};
