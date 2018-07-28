// Description:
//   Suggests an oblique strategy

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot strategy - Suggests a strategy
//   hubot a strategy for <user> - Suggests a strategy to user

// Notes:
//   You can be as verbose as you want as long as you address Hubot and mention
//   the word strategy and, optionally, one or more users.

//   Thanks, Brian Eno.

// Author:
//   hakanensari
module.exports = function(robot) {
  return robot.respond(/.*strategy/i, function(msg) {
    var mentions;
    mentions = msg.message.text.match(/(@\w+)/g);
    return robot.http('http://obliqueio.herokuapp.com').get()(function(err, res, body) {
      var strategy;
      strategy = JSON.parse(body);
      if (mentions) {
        strategy = `${mentions.join(', ')}: ${strategy}`;
      }
      return msg.send(strategy);
    });
  });
};
