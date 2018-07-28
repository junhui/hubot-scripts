// Description:
//   Notifies you by Prowl or NotifyMyAndroid when you're mentioned

// Dependencies:
//   "prowler": "0.0.3"

// Configuration:
//   None

// Commands:
//   hubot notify me by prowl with YOUR_PROWL_API_KEY
//   hubot notify me by nma with YOUR_NMA_API_KEY
//   hubot notify me by sms with 15556667890
//   hubot list notifiers

// Author:
//   marten

var Prowl, QS, https;

https = require("https");

Prowl = require("prowler");

QS = require("querystring");

module.exports = function(robot) {
  var checkIfOffline, notify, sendSms;
  sendSms = function(to, msg) {
    var auth, data, from, sid, tkn;
    sid = process.env.HUBOT_SMS_SID;
    tkn = process.env.HUBOT_SMS_TOKEN;
    from = process.env.HUBOT_SMS_FROM;
    auth = 'Basic ' + new Buffer(sid + ':' + tkn).toString("base64");
    data = QS.stringify({
      From: from,
      To: to,
      Body: `${msg.message.user.name}: ${msg.message.text}`
    });
    if (!sid) {
      msg.send("Twilio SID isn't set.");
      msg.send("Please set the HUBOT_SMS_SID environment variable.");
      return;
    }
    if (!tkn) {
      msg.send("Twilio token isn't set.");
      msg.send("Please set the HUBOT_SMS_TOKEN environment variable.");
      return;
    }
    if (!from) {
      msg.send("Twilio from number isn't set.");
      msg.send("Please set the HUBOT_SMS_FROM environment variable.");
      return;
    }
    return msg.http("https://api.twilio.com").path(`/2010-04-01/Accounts/${sid}/SMS/Messages.json`).header("Authorization", auth).header("Content-Type", "application/x-www-form-urlencoded").post(data)(function(err, res, body) {
      var json;
      json = JSON.parse(body);
      switch (res.statusCode) {
        case 201:
          return msg.send(`Sent sms to ${to}`);
        case 400:
          return msg.send(`Failed to send. ${json.message}`);
        default:
          return msg.send("Failed to send.");
      }
    });
  };
  notify = function(username, msg) {
    var apikey, i, len, notification, notifier, notifies, params, protocol, ref, results;
    notifies = [];
    console.error(`Going notify ${username}`);
    if (username === "all" || username === "everyone") {
      ref = robot.brain.data.notifiers;
      for (username in ref) {
        apikey = ref[username];
        if (username.toLowerCase() !== msg.message.user.name.toLowerCase()) {
          notifies.push(apikey);
        }
      }
    } else if (apikey = robot.brain.data.notifiers[username.toLowerCase()]) {
      notifies.push(apikey);
    }
    results = [];
    for (i = 0, len = notifies.length; i < len; i++) {
      notifier = notifies[i];
      [protocol, ...apikey] = notifier.split(':');
      apikey = apikey.join('');
      msg.send(`Notified ${protocol} by ${apikey}`);
      switch (protocol) {
        case "prowl":
          notification = new Prowl.connection(apikey);
          results.push(notification.send({
            application: 'RoQua Hubot',
            event: 'Mention',
            description: msg.message.text
          }));
          break;
        case "sms":
          console.error("Sending sms");
          results.push(sendSms(apikey, msg));
          break;
        case "nma":
          params = {
            apikey: apikey,
            application: "Hubot",
            event: "Mention",
            description: msg.message.text
          };
          results.push(msg.http("https://www.notifymyandroid.com/publicapi/notify").query(params).get()(function(err, res, body) {
            return body;
          }));
          break;
        default:
          results.push(void 0);
      }
    }
    return results;
  };
  checkIfOffline = function(user, callback) {
    var options, req;
    if (process.env.HUBOT_HIPCHAT_TOKEN) {
      options = {
        host: "api.hipchat.com",
        port: 443,
        path: "/v1/users/show?" + QS.stringify({
          format: "json",
          user_id: user.id,
          auth_token: process.env.HUBOT_HIPCHAT_TOKEN
        }),
        method: "GET"
      };
      req = https.request(options, function(res) {
        res.on("data", function(data) {
          var userData;
          userData = JSON.parse(data.toString());
          return callback(null, userData.user.status === "offline");
        });
        return res.on("error", function(err) {
          return callback(err);
        });
      });
      return req.end();
    } else {
      return callback(null, true);
    }
  };
  robot.hear(/@(\w+)/i, function(msg) {
    var mentionedUserId, mentionedUserName, ref, sender, theUser, user, userId, username;
    sender = msg.message.user.name.toLowerCase();
    mentionedUserName = msg.match[1].toLowerCase();
    if (mentionedUserName === "all" || mentionedUserName === "everyone") {
      notify("all", msg);
      msg.send("All notified!");
      return;
    }
    ref = robot.brain.users;
    for (userId in ref) {
      user = ref[userId];
      if (user.mention_name === mentionedUserName) {
        username = user.name;
        mentionedUserId = userId;
        theUser = user;
      }
    }
    if (mentionedUserId == null) {
      return;
    }
    return checkIfOffline(theUser, function(err, offline) {
      if (err) {
        throw err;
      } else if (offline) {
        return notify(username, msg);
      }
    });
  });
  robot.respond(/do not notify me/i, function(msg) {
    delete robot.brain.data.notifiers[msg.message.user.name.toLowerCase()];
    return msg.send("OK");
  });
  robot.respond(/notify me by prowl with (\w+)/i, function(msg) {
    var apikey, base;
    apikey = msg.match[1].toLowerCase();
    if ((base = robot.brain.data).notifiers == null) {
      base.notifiers = {};
    }
    robot.brain.data.notifiers[msg.message.user.name.toLowerCase()] = `prowl:${apikey}`;
    return msg.send("OK");
  });
  robot.respond(/notify me by nma with (\w+)/i, function(msg) {
    var apikey, base;
    apikey = msg.match[1].toLowerCase();
    if ((base = robot.brain.data).notifiers == null) {
      base.notifiers = {};
    }
    robot.brain.data.notifiers[msg.message.user.name.toLowerCase()] = `nma:${apikey}`;
    return msg.send("OK");
  });
  robot.respond(/notify me by sms with (\d+)/i, function(msg) {
    var base, number;
    number = msg.match[1].toLowerCase();
    if ((base = robot.brain.data).notifiers == null) {
      base.notifiers = {};
    }
    robot.brain.data.notifiers[msg.message.user.name.toLowerCase()] = `sms:${number}`;
    return msg.send("OK");
  });
  return robot.respond(/list notifiers/i, function(msg) {
    var apikey, ref, results, username;
    ref = robot.brain.data.notifiers;
    results = [];
    for (username in ref) {
      apikey = ref[username];
      results.push(msg.send(`I notify ${username} with ${apikey}`));
    }
    return results;
  });
};
