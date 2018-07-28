// Description:
//   gets tweet from user

// Dependencies:
//   "twit": "1.1.6"
//   "underscore": "1.4.4"

// Configuration:
//   HUBOT_TWITTER_CONSUMER_KEY
//   HUBOT_TWITTER_CONSUMER_SECRET
//   HUBOT_TWITTER_ACCESS_TOKEN
//   HUBOT_TWITTER_ACCESS_TOKEN_SECRET

// Commands:
//   hubot twitter <twitter username> - Show last tweet from <twitter username>
//   hubot twitter <twitter username> <n> - Cycle through tweet with <n> starting w/ latest

// Author:
//   KevinTraver

var Twit, _, config;

_ = require("underscore");

Twit = require("twit");

config = {
  consumer_key: process.env.HUBOT_TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.HUBOT_TWITTER_CONSUMER_SECRET,
  access_token: process.env.HUBOT_TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.HUBOT_TWITTER_ACCESS_TOKEN_SECRET
};

module.exports = function(robot) {
  var twit;
  twit = void 0;
  return robot.respond(/(twitter|lasttweet)\s+(\S+)\s?(\d?)/i, function(msg) {
    var count, username;
    if (!config.consumer_key) {
      msg.send("Please set the HUBOT_TWITTER_CONSUMER_KEY environment variable.");
      return;
    }
    if (!config.consumer_secret) {
      msg.send("Please set the HUBOT_TWITTER_CONSUMER_SECRET environment variable.");
      return;
    }
    if (!config.access_token) {
      msg.send("Please set the HUBOT_TWITTER_ACCESS_TOKEN environment variable.");
      return;
    }
    if (!config.access_token_secret) {
      msg.send("Please set the HUBOT_TWITTER_ACCESS_TOKEN_SECRET environment variable.");
      return;
    }
    if (!twit) {
      twit = new Twit(config);
    }
    username = msg.match[2];
    if (msg.match[3]) {
      count = msg.match[3];
    } else {
      count = 1;
    }
    return twit.get("statuses/user_timeline", {
      screen_name: escape(username),
      count: count,
      include_rts: false,
      exclude_replies: true
    }, function(err, reply) {
      if (err) {
        return msg.send("Error");
      }
      if (reply[0]['text']) {
        return msg.send(_.unescape(_.last(reply)['text']));
      }
    });
  });
};
