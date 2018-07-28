// Description:
//   Allows Hubot to send text messages using SMSified API.

// Dependencies:
//   None

// Configuration:
//   HUBOT_SMSIFIED_USERNAME
//   HUBOT_SMSIFIED_PASSWORD
//   HUBOT_SMSIFIED_SENDERADDRESS

// Commands:
//   hubot text <phonenumber> <message> - Sends <message> to <phonenumber>.

// Notes: 
//   test curl: curl -v "https://username:password@api.smsified.com/v1/smsmessaging/outbound/{senderAddress}/requests" -X POST  -d "address={phonenumber}&message={hello%0Aworld}"

// Author:
//   chrismatthieu
var QS;

QS = require("querystring");

module.exports = function(robot) {
  return robot.respond(/text (\d+) (.*)/i, function(msg) {
    var address, auth, data, message, password, senderAddress, username;
    address = msg.match[1];
    message = msg.match[2];
    username = process.env.HUBOT_SMSIFIED_USERNAME;
    password = process.env.HUBOT_SMSIFIED_PASSWORD;
    senderAddress = process.env.HUBOT_SMSIFIED_SENDERADDRESS;
    auth = 'Basic ' + new Buffer(username + ':' + password).toString("base64");
    data = QS.stringify({
      address: address,
      message: message
    });
    if (!username) {
      msg.send("SMSified username isn't set.");
      msg.send("Please set the HUBOT_SMSIFIED_USERNAME environment variable.");
      return;
    }
    if (!password) {
      msg.send("SMSified password isn't set.");
      msg.send("Please set the HUBOT_SMSIFIED_PASSWORD environment variable.");
      return;
    }
    if (!senderAddress) {
      msg.send("SMSified senderAddress isn't set.");
      msg.send("Please set the HUBOT_SMSIFIED_SENDERADDRESS environment variable.");
      return;
    }
    return msg.http("https://api.smsified.com").path(`/v1/smsmessaging/outbound/${senderAddress}/requests`).header("Authorization", auth).header("Content-Type", "application/x-www-form-urlencoded").post(data)(function(err, res, body) {
      var json;
      json = JSON.parse(body);
      switch (res.statusCode) {
        case 201:
          return msg.send(`Sent text message to ${address}`);
        case 400:
          return msg.send(`Failed to send text message. ${json.message}`);
        default:
          return msg.send("Failed to send text message.");
      }
    });
  });
};
