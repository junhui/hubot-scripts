  // Description:
  //   wunderlist allows you to add todos to your wunderlist directly from hubot

  // Dependencies:
  //   "mailer": "0.6.7"

  // Configuration:
  //   HUBOT_WUNDERLIST_SMTP_HOST - your smtp host e.g. smtp.gmail.com
  //   HUBOT_WUNDERLIST_SMTP_PORT - the port to connect to
  //   HUBOT_WUNDERLIST_SMTP_USESSL - whether you want to connect via SSL
  //   HUBOT_WUNDERLIST_SMTP_SENDDOMAIN - the domain from which to send
  //   HUBOT_WUNDERLIST_SMTP_USEAUTH - BOOL: authentication required
  //   HUBOT_WUNDERLIST_SMTP_AUTH_NAME - username for authentication
  //   HUBOT_WUNDERLIST_SMTP_AUTH_PASSWORD  - password for authentication

  // Commands:
  //   hubot wunderlist all the users       - display all users which have registered
  //   hubot wunderlist add me with <email> - add <email> as wunderlist login
  //   hubot wunderlist my login            - display your wunderlist email
  //   hubot wunderlist forget me           - remove the wunderlist login
  //   hubot wunderlist me <a todo>         - adds the todo to your wunderlist Inbox

  // Notes:
  //   Currently all todos are added to the Inbox.

  // Author:
  //   mrtazz
var mail,
  hasProp = {}.hasOwnProperty;

mail = require('mailer');

module.exports = function(robot) {
  robot.respond(/wunderlist all the users/i, function(msg) {
    var key, ref, theReply, user;
    theReply = "Here is who I know:\n";
    ref = robot.brain.users;
    for (key in ref) {
      if (!hasProp.call(ref, key)) continue;
      user = ref[key];
      if (user.wunderlistmail) {
        theReply += user.name + " is " + user.wunderlistmail + "\n";
      }
    }
    return msg.send(theReply);
  });
  robot.respond(/wunderlist add me with ([\w\d-_.]+@[\w\d-_.]+)/i, function(msg) {
    var wunderlistmail;
    wunderlistmail = msg.match[1];
    msg.message.user.wunderlistmail = wunderlistmail;
    return msg.send("Ok, you are " + wunderlistmail + " on Wunderlist");
  });
  robot.respond(/wunderlist my login/i, function(msg) {
    var text, user;
    user = msg.message.user;
    if (user.wunderlistmail) {
      return msg.reply("You are known as " + user.wunderlistmail + " on Wunderlist");
    } else {
      text = "I don't know who you are. You should probably identify yourself";
      text += "with your Wunderlist login";
      return msg.reply(text);
    }
  });
  robot.respond(/wunderlist forget me/i, function(msg) {
    var user;
    user = msg.message.user;
    user.wunderlistmail = null;
    return msg.reply("Ok, I have no idea who you are anymore.");
  });
  return robot.respond(/wunderlist me (.*)/i, function(msg) {
    var options, subject, todo, wunderlistmail;
    todo = msg.match[1];
    wunderlistmail = msg.message.user.wunderlistmail;
    // change list here
    subject = "Inbox";
    // option settings
    options = {
      host: process.env.HUBOT_WUNDERLIST_SMTP_HOST,
      port: process.env.HUBOT_WUNDERLIST_SMTP_PORT || 25,
      ssl: process.env.HUBOT_WUNDERLIST_SMTP_USESSL || true,
      domain: process.env.HUBOT_WUNDERLIST_SMTP_SENDDOMAIN || 'localhost',
      authentication: process.env.HUBOT_WUNDERLIST_SMTP_USEAUTH || false,
      username: process.env.HUBOT_WUNDERLIST_SMTP_AUTH_NAME,
      password: process.env.HUBOT_WUNDERLIST_SMTP_AUTH_PASSWORD
    };
    if (options.host) {
      options.authentication = options.authentication === true ? 'login' : 'none';
      options.to = 'me@wunderlist.com';
      options.from = wunderlistmail;
      options.subject = subject;
      options.body = todo;
      return mail.send(options, function(err, result) {
        console.log(err);
        if (err) {
          return msg.reply("I'm sorry, I couldn't add your todo.");
        } else {
          return msg.reply("Your todo was added.");
        }
      });
    }
  });
};
