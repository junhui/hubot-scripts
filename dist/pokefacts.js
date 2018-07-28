// Description:
//   Pokemon fun!

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   pokefact - get a random pokefact!

// Author:
//   eliperkins
module.exports = function(robot) {
  return robot.respond(/pokefact/i, function(msg) {
    return msg.http('https://api.twitter.com/1/statuses/user_timeline.json').query({
      screen_name: 'pokefacts',
      count: 100
    }).get()(function(err, res, body) {
      var tweet, tweets;
      tweets = JSON.parse(body);
      msg.send(tweets.length);
      if ((tweets != null) && tweets.length > 0) {
        tweet = msg.random(tweets);
        while (tweet.text.toLowerCase().indexOf('#pokefact') === -1) {
          tweet = msg.random(tweets);
        }
        return msg.send("PokeFACT: " + tweet.text.replace(/\#pokefact/i, ""));
      } else {
        return msg.reply("Couldn't find a PokeFACT");
      }
    });
  });
};
