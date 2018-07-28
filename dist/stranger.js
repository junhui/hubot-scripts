// Description:
//   Show some random person from facebook - their image, name, gender and nationality.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot stranger me - Meet someone new from facebook

// Author:
//   joelongstreet
module.exports = function(robot) {
  return robot.respond(/stranger me/i, function(msg) {
    return msg.http("http://facehold.it/hubot").get()(function(err, res, body) {
      var stranger;
      stranger = JSON.parse(body);
      msg.send(`Meet ${stranger.name}, the ${stranger.nationality} ${stranger.gender}. Learn more about ${(stranger.gender === 'male' ? 'him' : 'her')} at ${stranger.url}`);
      return msg.send(stranger.image);
    });
  });
};
