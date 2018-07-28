// Description:
//   Send messages to users the next time they speak

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot ambush <user name>: <message>

// Author:
//   jmoses
var appendAmbush;

appendAmbush = function(data, toUser, fromUser, message) {
  var name;
  data[name = toUser.name] || (data[name] = []);
  return data[toUser.name].push([fromUser.name, message]);
};

module.exports = function(robot) {
  robot.brain.on('loaded', () => {
    var base;
    return (base = robot.brain.data).ambushes || (base.ambushes = {});
  });
  robot.respond(/ambush (.*?): (.*)/i, function(msg) {
    var user, users;
    users = robot.brain.usersForFuzzyName(msg.match[1].trim());
    if (users.length === 1) {
      user = users[0];
      appendAmbush(robot.brain.data.ambushes, user, msg.message.user, msg.match[2]);
      return msg.send("Ambush prepared");
    } else if (users.length > 1) {
      return msg.send("Too many users like that");
    } else {
      return msg.send(`${msg.match[1]}? Never heard of 'em`);
    }
  });
  return robot.hear(/./i, function(msg) {
    var ambush, ambushes, i, len;
    if (robot.brain.data.ambushes == null) {
      return;
    }
    if ((ambushes = robot.brain.data.ambushes[msg.message.user.name])) {
      for (i = 0, len = ambushes.length; i < len; i++) {
        ambush = ambushes[i];
        msg.send(msg.message.user.name + ": while you were out, " + ambush[0] + " said: " + ambush[1]);
      }
      return delete robot.brain.data.ambushes[msg.message.user.name];
    }
  });
};
