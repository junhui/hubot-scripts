// Description:
//   Displays a random pizza gif from animatedpizzagifs.com

// Dependencies:
//   "tumblrbot": "0.1.0"

// Configuration:
//   HUBOT_TUMBLR_API_KEY - A Tumblr OAuth Consumer Key will work fine
//   HUBOT_MORE_PIZZA - Show pizza whenever anyone mentions it (default: false)

// Commands:
//   hubot pizza - Show a pizza gif

// Author:
//   iangreenleaf
var PIZZA, tumblr;

tumblr = require('tumblrbot');

PIZZA = "pizzagifs.tumblr.com";

module.exports = function(robot) {
  var func;
  func = process.env.HUBOT_MORE_PIZZA ? 'hear' : 'respond';
  return robot[func](/pizza/i, function(msg) {
    return tumblr.photos(PIZZA).random(function(post) {
      return msg.send(post.photos[0].original_size.url);
    });
  });
};
