// Description:
//   Hubot enjoys delicious snacks

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   botsnack - give the bot a food

// Author:
//   richo
//   locherm
var responses;

responses = ["Om nom nom!", "That's very nice of you!", "Oh thx, have a cookie yourself!", "Thank you very much.", "Thanks for the treat!"];

module.exports = function(robot) {
  return robot.hear(/botsnack/i, function(msg) {
    return msg.send(msg.random(responses));
  });
};
