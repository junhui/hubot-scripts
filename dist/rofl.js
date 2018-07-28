// Description:
//   Get a random ROFL image - warning, this includes NSFW content!

// Dependencies:
//   None

// Configuration:
//   None

// Author:
//   mcminton ripped from john-griffin
module.exports = function(robot) {
  return robot.hear(/rofl/i, function(msg) {
    return msg.http("http://serene-beyond-2652.herokuapp.com/random").get()(function(err, res, body) {
      return msg.send(JSON.parse(body).rofl);
    });
  });
};
