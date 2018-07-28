// Description:
//   Allows Hubot to lambast someone with a random insult

// Dependencies:
//   "cheerio: "0.7.0"

// Configuration:
//   None

// Commands:
//   hubot insult <name> - give <name> the what-for

// Author:
//   ajacksified, brandonvalentine
var cheerio, getQuote, insult;

cheerio = require('cheerio');

module.exports = function(robot) {
  return robot.respond(/insult (.*)/i, function(msg) {
    var name;
    name = msg.match[1].trim();
    return insult(msg, name);
  });
};

insult = function(msg, name) {
  return msg.http("http://www.randominsults.net").header("User-Agent: Insultbot for Hubot (+https://github.com/github/hubot-scripts)").get()(function(err, res, body) {
    return msg.send(`${name}: ${getQuote(body)}`);
  });
};

getQuote = function(body) {
  var $;
  $ = cheerio.load(body);
  return $('i').text();
};
