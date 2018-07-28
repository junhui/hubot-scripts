// Description:
//   Corgime

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot corgi me - Receive a corgi
//   hubot corgi bomb N - get N corgis

// Author:
//   alexgodin
module.exports = function(robot) {
  robot.respond(/corgi me/i, function(msg) {
    return msg.http("http://corginator.herokuapp.com/random").get()(function(err, res, body) {
      return msg.send(JSON.parse(body).corgi);
    });
  });
  return robot.respond(/corgi bomb( (\d+))?/i, function(msg) {
    var count;
    count = msg.match[2] || 5;
    return msg.http("http://corginator.herokuapp.com/bomb?count=" + count).get()(function(err, res, body) {
      var corgi, i, len, ref, results;
      ref = JSON.parse(body).corgis;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        corgi = ref[i];
        results.push(msg.send(corgi));
      }
      return results;
    });
  });
};
