// Description:
//   Display a random tweet from twitter about a subject

// Dependencies:
//    "ntwitter" : "https://github.com/sebhildebrandt/ntwitter/tarball/master",

// Configuration:
//   HUBOT_TWITTER_CONSUMER_KEY
//   HUBOT_TWITTER_CONSUMER_SECRET
//   HUBOT_TWITTER_ACCESS_TOKEN_KEY
//   HUBOT_TWITTER_ACCESS_TOKEN_SECRET

// Commands:
//   hubot <keyword> tweet - Returns a link to a tweet about <keyword>

// Notes:
//   There's an outstanding issue on AvianFlu/ntwitter#110 for search and the v1.1 API.
//   sebhildebrandt is a fork that is working, so we recommend that for now. This
//   can be removed after the issue is fixed and a new release cut, along with updating the dependency

// Author:
//   atmos, technicalpickles
var inspect, ntwitter;

ntwitter = require('ntwitter');

inspect = require('util').inspect;

module.exports = function(robot) {
  var auth, twit;
  auth = {
    consumer_key: process.env.HUBOT_TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.HUBOT_TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.HUBOT_TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.HUBOT_TWITTER_ACCESS_TOKEN_SECRET
  };
  twit = void 0;
  return robot.respond(/(.+) tweet(\s*)?$/i, function(msg) {
    if (!auth.consumer_key) {
      msg.send("Please set the HUBOT_TWITTER_CONSUMER_KEY environment variable.");
      return;
    }
    if (!auth.consumer_secret) {
      msg.send("Please set the HUBOT_TWITTER_CONSUMER_SECRET environment variable.");
      return;
    }
    if (!auth.access_token_key) {
      msg.send("Please set the HUBOT_TWITTER_ACCESS_TOKEN_KEY environment variable.");
      return;
    }
    if (!auth.access_token_secret) {
      msg.send("Please set the HUBOT_TWITTER_ACCESS_TOKEN_SECRET environment variable.");
      return;
    }
    if (twit == null) {
      twit = new ntwitter(auth);
    }
    return twit.verifyCredentials(function(err, data) {
      var q;
      if (err) {
        msg.send("Encountered a problem verifying twitter credentials :(", inspect(err));
        return;
      }
      q = escape(msg.match[1]);
      return twit.search(q, function(err, data) {
        var status;
        if (err) {
          msg.send("Encountered a problem twitter searching :(", inspect(err));
          return;
        }
        if ((data.statuses != null) && data.statuses.length > 0) {
          status = msg.random(data.statuses);
          return msg.send(`https://twitter.com/${status.user.screen_name}/status/${status.id_str}`);
        } else {
          return msg.reply("No one is tweeting about that.");
        }
      });
    });
  });
};
