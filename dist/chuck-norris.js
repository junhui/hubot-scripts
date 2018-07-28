// Description:
//   Chuck Norris awesomeness

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot chuck norris -- random Chuck Norris awesomeness
//   hubot chuck norris me <user> -- let's see how <user> would do as Chuck Norris

// Author:
//   dlinsin
module.exports = function(robot) {
  var askChuck;
  robot.respond(/(chuck norris)( me )?(.*)/i, function(msg) {
    var user;
    user = msg.match[3];
    if (user.length === 0) {
      return askChuck(msg, "http://api.icndb.com/jokes/random");
    } else {
      return askChuck(msg, "http://api.icndb.com/jokes/random?firstName=" + user + "&lastName=");
    }
  });
  return askChuck = function(msg, url) {
    return msg.http(url).get()(function(err, res, body) {
      var message_from_chuck;
      if (err) {
        return msg.send(`Chuck Norris says: ${err}`);
      } else {
        message_from_chuck = JSON.parse(body);
        if (message_from_chuck.length === 0) {
          return msg.send("Achievement unlocked: Chuck Norris is quiet!");
        } else {
          return msg.send(message_from_chuck.value.joke.replace(/\s\s/g, " "));
        }
      }
    });
  };
};
