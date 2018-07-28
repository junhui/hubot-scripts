// Description:
//   Fetches an image of the Mint Plaza Blue Bottle Line.

// Dependencies:
//   "cheerio": "0.7.0"

// Configuration:
//   None

// Commands:
//   hubot blue bottle me - gets an image of the line at the Mint Plaza Blue Bottle Coffee

// Author:
//   sloanesturz
var cheerio;

cheerio = require('cheerio');

module.exports = function(robot) {
  return robot.respond(/blue bottle me/i, function(msg) {
    return msg.http('http://bb.zaarly.com/').get()(function(err, res, body) {
      var $, url;
      if (res.statusCode !== 200) {
        return msg.send("Couldn't access http://bb.zaarly.com. No coffee for you!");
      } else {
        $ = cheerio.load(body);
        url = $('body').attr('style').match(/url\('(.+)'\)/)[1];
        return msg.send(url);
      }
    });
  });
};
