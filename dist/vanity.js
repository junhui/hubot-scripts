// Description:
//   Race to the bottom.

//   Battle it out with your mates to see who is the
//   most important/coolest/sexiest/funniest/smartest of them all solely
//   based on the clearly scientific number of twitter followers.

//   Vanity will check all the users that a specific twitter account, like say maybe
//   your company's twitter account, follows and display them in order by followers.

// Dependencies:
//   "sprintf": "0.1.1"

// Configuration:
//   HUBOT_VANITY_TWITTER_ACCOUNT

// Commands:
//   hubot vanity me - list peeps ordered by twitter followers

// Author:
//   maddox
var Path, countFollowers, sprintf;

Path = require("path");

sprintf = require("sprintf").sprintf;

countFollowers = function(msg, ids, cb) {
  var counts;
  counts = [];
  return ids.forEach(function(id) {
    console.log(id);
    return msg.http(`http://api.twitter.com/1/users/show.json?user_id=${id}`).get()(function(err, res, body) {
      var keptUser, last, response, user;
      user = JSON.parse(body);
      keptUser = {
        followers: user.followers_count,
        screen_name: user.screen_name
      };
      console.log(keptUser);
      counts.push(keptUser);
      if (counts.length === ids.length) {
        last = 0;
        response = "";
        counts.sort(function(x, y) {
          return y.followers - x.followers;
        });
        counts.forEach(function(user) {
          var diff;
          if (last > 0) {
            diff = last - user.followers;
            response += sprintf("%15s : %5d ( %4d to go)\n", user.screen_name, user.followers, diff);
          } else {
            response += sprintf("%15s : %5d\n", user.screen_name, user.followers);
          }
          return last = user.followers;
        });
        return cb(response);
      }
    });
  });
};

module.exports = function(robot) {
  return robot.respond(/vanity me$/i, function(msg) {
    return msg.http("http://api.twitter.com/1/friends/ids.json?screen_name=" + process.env.HUBOT_VANITY_TWITTER_ACCOUNT).get()(function(err, res, body) {
      if (res.statusCode === 200) {
        return countFollowers(msg, JSON.parse(body), function(output) {
          return msg.send(output);
        });
      } else {
        return msg.reply(`Sorry, not right now. Twitter's returning a ${res.statusCode} error`);
      }
    });
  });
};
