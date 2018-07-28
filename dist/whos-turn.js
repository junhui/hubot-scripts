// Description:
//   Who's turn to do something?

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot who <does something>? - Returns who does !

// Author:
//   KuiKui
var hasProp = {}.hasOwnProperty;

module.exports = function(robot) {
  return robot.respond(/(who|qui) (.+)\?/i, function(msg) {
    var key, ref, user, users;
    users = [];
    ref = robot.brain.users;
    for (key in ref) {
      if (!hasProp.call(ref, key)) continue;
      user = ref[key];
      if (`${user.name}` !== robot.name) {
        users.push(`${user.name}`);
      }
    }
    return msg.send((msg.random(users)).split(" ")[0] + " " + msg.match[2] + "!");
  });
};
