// Description:
//   Allows Hubot to send text messages using Twilio API

// Dependencies:
//   None

// Configuration:
//   HUBOT_SMS_SID
//   HUBOT_SMS_TOKEN
//   HUBOT_SMS_FROM

// Commands:
//   hubot sms <to> <message> - Sends <message> to the number <to>

// Author:
//   caleywoods
var QS;

QS = require("querystring");

module.exports = function(robot) {
  return robot.respond(/sms (\d+) (.*)/i, function(msg) {
    var auth, bahdy, data, from, sid, tkn, to;
    to = msg.match[1];
    bahdy = msg.match[2];
    sid = process.env.HUBOT_SMS_SID;
    tkn = process.env.HUBOT_SMS_TOKEN;
    from = process.env.HUBOT_SMS_FROM;
    auth = 'Basic ' + new Buffer(sid + ':' + tkn).toString("base64");
    data = QS.stringify({
      From: from,
      To: to,
      Body: bahdy
    });
    if (!sid) {
      msg.send("Twilio SID isn't set.");
      msg.send("Please set the HUBOT_SMS_SID environment variable.");
      return;
    }
    if (!tkn) {
      msg.send("Twilio token isn't set.");
      msg.send("Please set the HUBOT_SMS_TOKEN environment variable.");
      return;
    }
    if (!from) {
      msg.send("Twilio from number isn't set.");
      msg.send("Please set the HUBOT_SMS_FROM environment variable.");
      return;
    }
    return msg.http("https://api.twilio.com").path(`/2010-04-01/Accounts/${sid}/SMS/Messages.json`).header("Authorization", auth).header("Content-Type", "application/x-www-form-urlencoded").post(data)(function(err, res, body) {
      var json;
      json = JSON.parse(body);
      switch (res.statusCode) {
        case 201:
          return msg.send(`Sent sms to ${to}`);
        case 400:
          return msg.send(`Failed to send. ${json.message}`);
        default:
          return msg.send("Failed to send.");
      }
    });
  });
};
