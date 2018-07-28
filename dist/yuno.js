// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   HUBOT_YUNO_URL
//   HUBOT_YUNO_AUTH_TOKEN

// Commands:
//   <name> y u no <action> - U NO WHAT IT DOES

// Notes:
//   Get image generation script at https://github.com/alexdean/yuno

// Author:
//   alexdean
module.exports = function(robot) {
  return robot.hear(/(.*) y u no (.*)/i, function(msg) {
    if (process.env.HUBOT_YUNO_URL == null) {
      msg.send("HUBOT_YUNO_URL is not set.");
      return;
    }
    return msg.http(process.env.HUBOT_YUNO_URL).query({
      auth: process.env.HUBOT_YUNO_AUTH_TOKEN,
      name: msg.match[1],
      action: msg.match[2]
    }).get()(function(err, res, body) {
      if (err) {
        msg.send(`error: ${err}`);
        return;
      }
      return msg.send(body);
    });
  });
};
