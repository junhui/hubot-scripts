// Description:
//   Tell Hubot what you're working on so he can give out status updates when asked

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot i am working on <anything> - Set what you're working on
//   hubot what is everyone working on? - Find out what everyone is working on

// Author:
//   beezee
module.exports = function(robot) {
  robot.respond(/(?:what\'s|what is|whats) @?([\w .\-]+) working on(?:\?)?$/i, function(msg) {
    var k, messageText, name, u, user, users;
    name = msg.match[1].trim();
    if (name === "you") {
      return msg.send("I dunno, robot things I guess.");
    } else if (name.toLowerCase() === robot.name.toLowerCase()) {
      return msg.send("World domination!");
    } else if (name.match(/(everybody|everyone)/i)) {
      messageText = '';
      users = robot.brain.users();
      for (k in users) {
        u = users[k];
        if (u.workingon) {
          messageText += `${u.name} is working on ${u.workingon}\n`;
        } else {
          messageText += "";
        }
      }
      if (messageText.trim() === "") {
        messageText = "Nobody told me a thing.";
      }
      return msg.send(messageText);
    } else {
      users = robot.brain.usersForFuzzyName(name);
      if (users.length === 1) {
        user = users[0];
        user.workingon = user.workingon || [];
        if (user.workingon.length > 0) {
          return msg.send(`${name} is working on ${user.workingon}.`);
        } else {
          return msg.send(`${name} is slacking off.`);
        }
      } else if (users.length > 1) {
        return msg.send(getAmbiguousUserText(users));
      } else {
        return msg.send(`${name}? Who's that?`);
      }
    }
  });
  return robot.respond(/(?:i\'m|i am|im) working on (.*)/i, function(msg) {
    var name, user;
    name = msg.message.user.name;
    user = robot.brain.userForName(name);
    if (typeof user === 'object') {
      user.workingon = msg.match[1];
      return msg.send(`Okay ${user.name}, got it.`);
    } else if (typeof user.length > 1) {
      return msg.send(`I found ${user.length} people named ${name}`);
    } else {
      return msg.send(`I have never met ${name}`);
    }
  });
};
