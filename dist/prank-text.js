// Description:
//   Prank text a friend (or enemy)

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect: "0.2.0"

// Configuration:
//   SMS_USERNAME
//   SMS_PASSWORD
//   SMS_FROM

// Commands:
//   hubot drunk-text <number> - send a text to <number>
//   hubot prank-text <number> - send a text to <number>

// Author:
//   vanetix
var HTMLParser, QueryString, SMSIFIED, SMS_FROM, SMS_PASSWORD, SMS_USERNAME, Select, TFLN, retrieveText, sendText, util;

HTMLParser = require("htmlparser");

Select = require("soupselect").select;

QueryString = require("querystring");

util = require('util');

TFLN = "http://textsfromlastnight.com/Random-Texts-From-Last-Night.html";

SMSIFIED = "https://api.smsified.com";

SMS_USERNAME = process.env.SMS_USERNAME;

SMS_PASSWORD = process.env.SMS_PASSWORD;

SMS_FROM = process.env.SMS_FROM;

module.exports = function(robot) {
  return robot.respond(/(drunk-text|prank-text) (\d+)/i, function(msg) {
    var number;
    number = msg.match[2];
    return retrieveText(msg, function(text) {
      if (text === false) {
        msg.send("An error occurred while getting a random text.");
      }
      return sendText(msg, number, text, function(status) {
        if (status === true) {
          return msg.send(`Message: ${text} has been sent to ${number}.`);
        } else {
          return msg.send("An error occurred while sending the text.");
        }
      });
    });
  });
};

sendText = function(botHandle, to, text, callback) {
  var authString, payload;
  payload = QueryString.stringify({
    address: to,
    message: text
  });
  authString = "Basic " + new Buffer(SMS_USERNAME + ":" + SMS_PASSWORD).toString("base64");
  return botHandle.http(SMSIFIED).path(`/v1/smsmessaging/outbound/${SMS_FROM}/requests`).header("Authorization", authString).header("Content-Type", "application/x-www-form-urlencoded").post(payload)(function(err, res, body) {
    if ((err == null) && res.statusCode === 201) {
      return callback(true);
    } else {
      return callback(false);
    }
  });
};

retrieveText = function(msg, callback) {
  return msg.http(TFLN).get()(function(err, res, body) {
    var handler, nodes, parser, ref, ref1;
    if (res.statusCode === !200 || (err != null)) {
      return callback(false);
    } else {
      handler = new HTMLParser.DefaultHandler((function(err) {
        if (err) {
          return callback('Problem parsing the text.');
        }
      }), {
        ignoreWhitespace: true
      });
      parser = new HTMLParser.Parser(handler);
      parser.parseComplete(body);
      nodes = Select(handler.dom, "#texts-list li .text p a");
      return callback(((ref = nodes[0]) != null ? (ref1 = ref.children[0]) != null ? ref1.data : void 0 : void 0) || false);
    }
  });
};
