// Description:
//   Make hubot fetch quotes pertaining to the world's best secret agent, Archer.

// Dependencies:
//   "scraper": "0.0.9"

// Configuration:
//   None

// Commands:

// Author:
//   rrix
var scraper;

scraper = require('scraper');

module.exports = function(robot) {
  robot.hear(/^loggin/i, function(msg) {
    return msg.reply("call Kenny Loggins, 'cuz you're in the DANGER ZONE.");
  });
  robot.hear(/^sitting down/i, function(msg) {
    return msg.reply("What?! At the table? Look, he thinks he's people!");
  });
  robot.hear(/archer/i, function(msg) {
    var options;
    options = {
      'uri': 'http://en.wikiquote.org/wiki/Archer_(TV_series)',
      'headers': {
        'User-Agent': 'User-Agent: Archerbot for Hubot (+https://github.com/github/hubot-scripts)'
      }
    };
    return scraper(options, function(err, jQuery) {
      var dialog, quote, quotes;
      if (err) {
        throw err;
      }
      quotes = jQuery("dl").toArray();
      dialog = '';
      quote = quotes[Math.floor(Math.random() * quotes.length)];
      dialog += jQuery(quote).text().trim() + "\n";
      return msg.send(dialog);
    });
  });
  // Make it possible to turn off a few of the more NSFW ones
  if (!process.env.HUBOT_ARCHER_SFW) {
    robot.hear(/^benoit/i, function(msg) {
      return msg.send("balls");
    });
    return robot.hear(/love/i, function(msg) {
      return msg.reply("And I love that I have an erection... that doesn't involve homeless people.");
    });
  }
};
