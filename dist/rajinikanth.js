// Description:
//   Rajinikanth is Chuck Norris of India, witness his awesomeness.

// Dependencies:
//   "cheerio": "0.7.0"

// Configuration:
//   None

// Commands:
//   hubot rajinikanth|rajini -- random Rajinikanth awesomeness
//   hubot rajinikanth|rajini me <user> -- let's see how <user> would do as Rajinikanth

// Author:
//   juzerali
var cheerio, url;

cheerio = require('cheerio');

url = "http://rajinikanthfacts.com/";

module.exports = function(robot) {
  return robot.respond(/(?:rajinikanth|rajini)(?: me)? ?(.*)/i, function(msg) {
    var user;
    user = msg.match[1];
    return msg.http(url).get()(function(err, res, body) {
      var $, fact;
      if (err) {
        return msg.send(`Rajinikanth says: ${err}`);
      } else {
        $ = cheerio.load(body);
        fact = $(".fact").find(".ftext").text();
        if (!!user) {
          fact = fact.replace(/raji?ni(kanth?)?/ig, user);
        }
        return msg.send(fact);
      }
    });
  });
};
