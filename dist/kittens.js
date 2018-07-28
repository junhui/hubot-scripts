// Description:
//   Kittens!

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot kitten me - A randomly selected kitten
//   hubot kitten me <w>x<h> - A kitten of the given size
//   hubot kitten bomb me <number> - Many many kittens!

// Author:
//   dstrelau
var kittenMe;

module.exports = function(robot) {
  robot.respond(/kittens?(?: me)?$/i, function(msg) {
    return msg.send(kittenMe());
  });
  robot.respond(/kittens?(?: me)? (\d+)(?:[x ](\d+))?$/i, function(msg) {
    return msg.send(kittenMe(msg.match[1], msg.match[2] || msg.match[1]));
  });
  return robot.respond(/kitten bomb(?: me)?( \d+)?$/i, function(msg) {
    var i, j, kittens, ref, results;
    kittens = msg.match[1] || 5;
    results = [];
    for (i = j = 1, ref = kittens; (1 <= ref ? j <= ref : j >= ref); i = 1 <= ref ? ++j : --j) {
      results.push(msg.send(kittenMe()));
    }
    return results;
  });
};

kittenMe = function(height, width) {
  var h, root, w;
  h = height || Math.floor(Math.random() * 250) + 250;
  w = width || Math.floor(Math.random() * 250) + 250;
  root = "http://placekitten.com";
  if (Math.random() > 0.5) { // greyscale kittens!
    root += "/g";
  }
  return `${root}/${h}/${w}#.png`;
};
