// Description:
//   Bittertweet Curmudgeonpants
//   Random tweets from @cumber_world

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   cumberbatch - Hubot responds with a random @cumber_world creation from the last 200 tweets

// Author:
//   froots
module.exports = function(robot) {
  return robot.hear(/cumberbatch/i, function(msg) {
    return msg.http("http://api.twitter.com/1/statuses/user_timeline.json?screen_name=cumber_world&count=200&exclude_replies=true&include_rts=false").get()(function(err, res, body) {
      var response;
      response = JSON.parse(body);
      if (response && response.length) {
        return msg.send(msg.random(response).text);
      }
    });
  });
};
