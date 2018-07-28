// Description:
//   Tell Hubot to send a user a message right now !

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot im <username> <some message> - im <username> <some message> right now !

// Author:
//   earlonrails & ggongaware

// Additional Requirements
//   Only works on gtalk
module.exports = function(robot) {
  return robot.respond(/im ([\w.-@]*) (.*)/i, function(msg) {
    var new_user;
    new_user = {
      id: msg.match[1] + "@" + msg.message.user.domain,
      name: msg.match[1],
      user: msg.match[1],
      type: "chat"
    };
    return robot.send(new_user, msg.match[2]);
  });
};
