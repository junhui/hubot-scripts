// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot horse - Display a randomly selected insight on the world from Horse_Ebooks

// Author:
//   lavelle
module.exports = function(robot) {
  return robot.respond(/horse/i, function(msg) {
    var url;
    url = 'http://api.twitter.com/1/statuses/user_timeline.json';
    return msg.http(url).query({
      screen_name: 'horse_ebooks',
      count: 10
    }).get()(function(err, res, body) {
      var n, tweets;
      tweets = JSON.parse(body);
      if ((tweets != null) && tweets.length > 0) {
        n = Math.floor(Math.random() * tweets.length || 0);
        return msg.send(tweets[n].text);
      } else {
        return msg.reply("Couldn't find any insights for you this time");
      }
    });
  });
};
