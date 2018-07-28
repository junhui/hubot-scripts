// Description:
//   Github Credentials allows you to map your user against your GitHub user.
//   This is specifically in order to work with apps that have GitHub Oauth users.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot who do you know - List all the users with github logins tracked by Hubot
//   hubot i am `maddox` - map your user to the github login `maddox`
//   hubot who am i - reveal your mapped github login
//   hubot forget me - de-map your user to your github login

// Author:
//   maddox
var hasProp = {}.hasOwnProperty;

module.exports = function(robot) {
  robot.respond(/who do you know(\?)?$/i, function(msg) {
    var key, ref, theReply, user;
    theReply = "Here is who I know:\n";
    ref = robot.brain.users();
    for (key in ref) {
      if (!hasProp.call(ref, key)) continue;
      user = ref[key];
      if (user.githubLogin) {
        theReply += `${user.name} is ${user.githubLogin}\n`;
      }
    }
    return msg.send(theReply);
  });
  robot.respond(/i am ([a-z0-9-]+)\s*$/i, function(msg) {
    var githubLogin;
    githubLogin = msg.match[1];
    msg.message.user.githubLogin = githubLogin;
    return msg.send(`Ok, you are ${githubLogin} on GitHub`);
  });
  robot.respond(/who am i\s*$/i, function(msg) {
    var user;
    user = msg.message.user;
    if (user.githubLogin) {
      return msg.reply(`You are known as ${user.githubLogin} on GitHub`);
    } else {
      return msg.reply("I don't know who you are. You should probably identify yourself with your GitHub login");
    }
  });
  return robot.respond(/forget me/i, function(msg) {
    var user;
    user = msg.message.user;
    user.githubLogin = null;
    return msg.reply("Ok, I have no idea who you are anymore.");
  });
};
