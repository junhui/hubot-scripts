// Description
//   random cat gifs as a service for your cat gif driven development
//   source for the service: https://github.com/flores/moarcats
//   most of the below is lifted from corgime.coffee

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot moarcats me - links http://edgecats.net, which serves a random cat gif
//   hubot moarcats bomb <n> - gives <n> cat gifs

// Author:
//   flores
module.exports = function(robot) {
  robot.respond(/moarcats me/i, function(msg) {
    return msg.http("http://edgecats.net/random").get()(function(err, res, body) {
      return msg.send(body);
    });
  });
  return robot.respond(/moarcats bomb( (\d+))?/i, function(msg) {
    var cat, count, i, ref, results;
    count = msg.match[2] || 5;
    results = [];
    for (cat = i = 1, ref = count; (1 <= ref ? i <= ref : i >= ref); cat = 1 <= ref ? ++i : --i) {
      results.push(msg.http("http://edgecats.net/random").get()(function(err, res, body) {
        return msg.send(body);
      }));
    }
    return results;
  });
};
