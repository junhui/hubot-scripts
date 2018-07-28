// Description:
//   Get a random WAT image - warning, this includes NSFW content!

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot wat - Random WAT

// Author:
//   john-griffin
module.exports = function(robot) {
  return robot.respond(/wat/i, function(msg) {
    return msg.http("http://watme.herokuapp.com/random").get()(function(err, res, body) {
      return msg.send(JSON.parse(body).wat);
    });
  });
};
