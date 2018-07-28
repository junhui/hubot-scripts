// Description:
//   Approve or disapprove of something

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot <user> disapproves - Disapprove of something
//   hubot <user> approves - Approve of something

// Author:
//   eliperkins
module.exports = function(robot) {
  robot.respond(/@?([\w .-_]+) disapproves/i, function(msg) {
    var firstname, name, user;
    name = msg.match[1];
    user = msg.message.user;
    firstname = user.name.toLowerCase().split(" ")[0];
    if (firstname === name) {
      return msg.send("http://i3.kym-cdn.com/photos/images/newsfeed/000/254/517/a70.gif");
    } else {
      return msg.send(firstname + ", stop pretending to be " + name);
    }
  });
  return robot.respond(/@?([\w .-_]+) approves/i, function(msg) {
    var firstname, name, user;
    name = msg.match[1];
    user = msg.message.user;
    firstname = user.name.toLowerCase().split(" ")[0];
    if (firstname === name) {
      return msg.send("http://i1.kym-cdn.com/photos/images/newsfeed/000/254/655/849.gif");
    } else {
      return msg.send(firstname + ", stop pretending to be " + name);
    }
  });
};
