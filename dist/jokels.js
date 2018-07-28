// Description:
//   Returns a random joke from jokels.com

// Dependencies:
//   None

// Commands:
//   hubot joke/jokel/jokels - Returns a random joke from jokels.com

// Author:
//   sylturner
module.exports = function(robot) {
  return robot.respond(/(jokel|jokels|joke)/i, function(msg) {
    return msg.http('http://jokels.com/random_joke').get()(function(err, res, body) {
      var joke, vote;
      joke = JSON.parse(body).joke;
      vote = joke.up_votes - joke.down_votes;
      msg.send(`${joke.question}`);
      return setTimeout(function() {
        msg.send(`${joke.answer}`);
        return setTimeout(function() {
          return msg.send(`${vote} upvotes - ${joke.bitly_url}`);
        }, 1000);
      }, 4000);
    });
  });
};
