// Description:
//   Tell Hubot to send a user a link to lmgtfy.com

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot lmgtfy <optional @username> <some query>

// Author:
//   phlipper
module.exports = function(robot) {
  return robot.respond(/lmgtfy?\s?(?:@(\w*))? (.*)/i, function(msg) {
    var link;
    link = "";
    if (msg.match[1]) {
      link += `${msg.match[1]}: `;
    }
    link += `http://lmgtfy.com/?q=${escape(msg.match[2])}`;
    return msg.send(link);
  });
};
