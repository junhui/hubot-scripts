// Description:
//   Allows Hubot to send text messages using 46elks.com API.

// Dependencies:
//   None

// Configuration:
//   HUBOT_46ELKS_USERNAME
//   HUBOT_46ELKS_PASSWORD

// Commands:
//   hubot sms <user> <message> - Sends <message> to the number <to>
//   hubot <user> has phone number <phone> - Sets the phone number of <user> to <phone>
//   hubot give me the phone number to <user> - Gets the phone number of <user>

// Author:
//   kimf
var QS;

QS = require("querystring");

module.exports = function(robot) {
  var getAmbiguousUserText;
  getAmbiguousUserText = function(users) {
    var user;
    return `Be more specific, I know ${users.length} people named like that: ${((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = users.length; i < len; i++) {
        user = users[i];
        results.push(user.name);
      }
      return results;
    })()).join(", ")}`;
  };
  robot.respond(/sms (\w+) (.*)/i, function(msg) {
    var auth, bahdy, data, from, pass, to, user, users;
    to = msg.match[1];
    bahdy = msg.match[2];
    user = process.env.HUBOT_46ELKS_USERNAME;
    pass = process.env.HUBOT_46ELKS_PASSWORD;
    from = "Hubot";
    auth = 'Basic ' + new Buffer(user + ':' + pass).toString("base64");
    if (!user) {
      msg.send("46Elks USERNAME isn't set.");
      msg.send("Please set the HUBOT_46ELKS_USERNAME environment variable.");
      return;
    }
    if (!pass) {
      msg.send("46Elks PASSWORD isn't set.");
      msg.send("Please set the HUBOT_46ELKS_PASSWORD environment variable.");
      return;
    }
    //get <user>'s phone number as listed in the brain
    if (user = robot.brain.userForName(to)) {
      if (user.phone === "") {
        msg.send(user.name + ' has no phone! set it with <user> has phone <phone>');
        return;
      } else {
        to = user.phone;
        to = to.toString().replace(/\d/, '+46');
      }
    } else {
      users = robot.brain.usersForFuzzyName(to);
      if (users.length === 1) {
        user = users[0];
        to = user.phone;
        to = to.toString().replace(/\d/, '+46');
      } else if (users.length > 1) {
        msg.send(getAmbiguousUserText(users));
        return;
      } else {
        msg.send('Me cant find ' + to + ', are you sure that person is born?');
        return;
      }
    }
    data = QS.stringify({
      from: from,
      to: to,
      message: bahdy
    });
    return msg.http("https://api.46elks.com").path("/a1/SMS").header("Authorization", auth).post(data)(function(err, res, body) {
      switch (res.statusCode) {
        case 200:
          return msg.send(`Sent sms to ${user.name}`);
        default:
          return msg.send("Failed to send.");
      }
    });
  });
  robot.respond(/@?([\w .-_]+) has phone number (\d*)*$/i, function(msg) {
    var name, phone, user, users;
    name = msg.match[1];
    phone = msg.match[2].trim();
    users = robot.brain.usersForFuzzyName(name);
    if (users.length === 1) {
      user = users[0];
      if (user.phone === phone) {
        return msg.send("I know.");
      } else {
        user.phone = phone;
        return msg.send(`Ok, ${name} has phone ${phone}.`);
      }
    } else if (users.length > 1) {
      return msg.send(getAmbiguousUserText(users));
    } else {
      return msg.send(`I don't know anything about ${name}.`);
    }
  });
  return robot.respond(/@?give me the phone number to ([\w .-_]+)*/i, function(msg) {
    var name, user, users;
    name = msg.match[1];
    users = robot.brain.usersForFuzzyName(name);
    if (users.length === 1) {
      user = users[0];
      if (user.phone.length < 1) {
        return msg.send(`${user.name} has no phone, set it first!`);
      } else {
        return msg.send(`${user.name} has phone number ${user.phone}.`);
      }
    } else if (users.length > 1) {
      return msg.send(getAmbiguousUserText(users));
    } else {
      return msg.send(`I don't know anything about ${name}.`);
    }
  });
};
