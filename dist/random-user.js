// Description:
//   Generate random user data from randomuser.me

// Dependencies:
//   None

// Commands:
//   hubot random user - Get random user data from randomuser.me

// Author:
//   tombell
String.prototype.capitalize = function() {
  return `${this.charAt(0).toUpperCase()}${this.slice(1)}`;
};

module.exports = function(robot) {
  return robot.respond(/(random|generate) user/i, function(msg) {
    return msg.http('http://api.randomuser.me/').get()(function(err, res, body) {
      var data;
      if (err != null) {
        return msg.reply(`Error occured generating a random user: ${err}`);
      } else {
        try {
          data = JSON.parse(body).results[0].user;
          return msg.send(`${data.name.first.capitalize()} ${data.name.last.capitalize()}\n` + `Gender: ${data.gender}\n` + `Email: ${data.email}\n` + `Picture: ${data.picture}`);
        } catch (error) {
          err = error;
          return msg.reply(`Error occured parsing response body: ${err}`);
        }
      }
    });
  });
};
