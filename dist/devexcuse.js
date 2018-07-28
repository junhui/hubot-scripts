// Description:
//   Dev excuses scraper. From http://developerexcuses.com/

// Dependencies:

//   "cheerio": "~0.12.0"

// Commands:
//   hubot excuse me
var cheerio;

cheerio = require('cheerio');

module.exports = function(robot) {
  return robot.respond(/excuse me/i, function(msg) {
    return robot.http("http://developerexcuses.com/").get()(function(err, res, body) {
      var $;
      $ = cheerio.load(body);
      return msg.send($('.wrapper a').text());
    });
  });
};
