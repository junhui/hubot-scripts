// Description:
//   Pulls GIFs from various insane tumblrs

// Dependencies:
//   "tumblrbot": "0.1.0"

// Configuration:
//   HUBOT_TUMBLR_API_KEY - A Tumblr OAuth Consumer Key will work fine

// Commands:
//   hubot gif me - Returns a random gif from a random blog
//   hubot food mosh - Returns a random gif from foodmosh.tumblr.com
//   hubot fluxmachine - Returns a random gif from fluxmachine.tumblr.com
//   hubot android - Returns a random gif from milosrajkovic.tumblr.com
//   hubot nic cage me - Returns a random gif from gifolas-cage.tumblr.com

// Author:
//   iangreenleaf
var SOURCES, getGif, tumblr;

tumblr = require("tumblrbot");

SOURCES = {
  "foodmosh.tumblr.com": /(food)( mosh)?( me)?/i,
  "fluxmachine.tumblr.com": /(flux)( ?machine)?( me)?/i,
  "gifolas-cage.tumblr.com": /(nic )?cage( me)?/i,
  "milosrajkovic.tumblr.com": /(android )( me)?/i
};

getGif = function(blog, msg) {
  return tumblr.photos(blog).random(function(post) {
    return msg.send(post.photos[0].original_size.url);
  });
};

module.exports = function(robot) {
  var blog, pattern, results;
  robot.respond(/gif(sanity)?( me)?/i, function(msg) {
    var blog;
    blog = msg.random(Object.keys(SOURCES));
    return getGif(blog, msg);
  });
  results = [];
  for (blog in SOURCES) {
    pattern = SOURCES[blog];
    results.push(robot.respond(pattern, function(msg) {
      return getGif(blog, msg);
    }));
  }
  return results;
};
