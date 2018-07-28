// Description:
//   Display cricket scores for current live games

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot cricket scores for <team> - Returns the current score of live game
//   hubot cricket scores for all - Returns the current score of all live games

// Author:
//   adtaylor
module.exports = function(robot) {
  var feed_url, prefix;
  feed_url = "http://query.yahooapis.com/v1/public/yql?q=select%20title%20from%20rss%20where%20url%3D%22http%3A%2F%2Fstatic.cricinfo.com%2Frss%2Flivescores.xml%22&format=json&diagnostics=true&callback=";
  prefix = "CRICKET SCORE: ";
  robot.respond(/cricket scores for (.*)/i, function(msg) {
    var query, ref;
    query = (ref = msg.match[1]) != null ? ref.toUpperCase() : void 0;
    return msg.http(feed_url).get()(function(err, res, body) {
      var ref1, results, scores;
      results = JSON.parse(body);
      scores = (ref1 = results.query.results) != null ? ref1.item : void 0;
      if (!scores) {
        return msg.send(prefix + "No games currently in progress.");
      }
      if (query === "ALL") {
        return scores.forEach(function(score) {
          return msg.send(prefix + score.title);
        });
      } else {
        return scores.forEach(function(score) {
          if (score.title.toUpperCase().search(query) !== -1) {
            return msg.send(prefix + score.title);
          }
        });
      }
    });
  });
  return robot.respond(/do you like cricket?(.*)/i, function(msg) {
    return msg.send("No, I love it!");
  });
};
