// Description:
//   Talklikewarrenellis.com random quote builder

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot good morning - Receive a random quote from the warren ellis generator

// Author:
//   vosechu
module.exports = function(robot) {
  robot.hear(/(talk like warren ellis|ellis)/i, function(msg) {
    return msg.http("http://talklikewarrenellis.com/random.php").get()(function(err, res, body) {
      return msg.send(JSON.parse(body).quote);
    });
  });
  return robot.hear(/good (morning|afternoon|evening|day|night)/i, function(msg) {
    return msg.http("http://talklikewarrenellis.com/random.php").get()(function(err, res, body) {
      return msg.send(JSON.parse(body).quote);
    });
  });
};
