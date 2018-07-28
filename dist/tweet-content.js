// Description:
//   Detect tweet URL and send tweet content

// Dependencies:
//  "ntwitter": "0.2.10"
//  "underscore": "1.5.1"

// Configuration:
//   HUBOT_TWITTER_CONSUMER_KEY
//   HUBOT_TWITTER_CONSUMER_SECRET
//   HUBOT_TWITTER_ACCESS_TOKEN_KEY
//   HUBOT_TWITTER_ACCESS_TOKEN_SECRET

// Commands:
//   None

// Author:
//   Vrtak-CZ, kdaigle
var _, ntwitter;

ntwitter = require('ntwitter');

_ = require('underscore');

module.exports = function(robot) {
  var auth, twit;
  auth = {
    consumer_key: process.env.HUBOT_TWITTER_CONSUMER_KEY,
    consumer_secret: process.env.HUBOT_TWITTER_CONSUMER_SECRET,
    access_token_key: process.env.HUBOT_TWITTER_ACCESS_TOKEN_KEY,
    access_token_secret: process.env.HUBOT_TWITTER_ACCESS_TOKEN_SECRET,
    rest_base: 'https://api.twitter.com/1.1'
  };
  if (!auth.consumer_key || !auth.consumer_secret || !auth.access_token_key || !auth.access_token_secret) {
    console.log("twitter-content.coffee: HUBOT_TWITTER_CONSUMER_KEY, HUBOT_TWITTER_CONSUMER_SECRET, HUBOT_TWITTER_ACCESS_TOKEN_KEY, and HUBOT_TWITTER_ACCESS_TOKEN_SECRET are required.");
    return;
  }
  twit = new ntwitter(auth);
  return robot.hear(/https?:\/\/(mobile\.)?twitter\.com\/.*?\/status\/([0-9]+)/i, function(msg) {
    return twit.getStatus(msg.match[2], function(err, tweet) {
      var i, j, len, len1, media, ref, ref1, tweet_text, url;
      if (err) {
        console.log(err);
        return;
      }
      tweet_text = _.unescape(tweet.text);
      if (tweet.entities.urls != null) {
        ref = tweet.entities.urls;
        for (i = 0, len = ref.length; i < len; i++) {
          url = ref[i];
          tweet_text = tweet_text.replace(url.url, url.expanded_url);
        }
      }
      if (tweet.entities.media != null) {
        ref1 = tweet.entities.media;
        for (j = 0, len1 = ref1.length; j < len1; j++) {
          media = ref1[j];
          tweet_text = tweet_text.replace(media.url, media.media_url);
        }
      }
      return msg.send(`@${tweet.user.screen_name}: ${tweet_text}`);
    });
  });
};
