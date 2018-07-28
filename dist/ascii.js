// Description:
//   ASCII art

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot ascii me <text> - Show text in ascii art

// Author:
//   atmos
module.exports = function(robot) {
  return robot.respond(/ascii( me)? (.+)/i, function(msg) {
    return msg.http("http://asciime.herokuapp.com/generate_ascii").query({
      s: msg.match[2].split(' ').join('  ')
    }).get()(function(err, res, body) {
      return msg.send(body);
    });
  });
};
