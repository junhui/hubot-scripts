// Description
//   Status is a simple user status message updater

// Dependencies:
//   "underscore": "1.3.3"

// Configuration:
//   None

// Commands:
//   hubot away <away_message> - Sets you as "away" and optionally sets an away
//                        message. While away, anybody who mentions you
//                        will be shown your away message. Remember AIM?

//   hubot return - Removes your away flag & away message

//   hubot status <status_message> - Sets your status to status_message.

//   hubot status <username> - Tells you the status of username

//   Shortcuts Commands:
//     hubot a <away_message>
//     hubot r
//     hubot s <status_message>
//     hubot s <username>

// Notes:
//   We opted to used the '/<trigger>' syntax in favor of the 'hubot <trigger>'
//   syntax, because the commands are meant to be convenient. You can always
//   change it to use the 'hubot <trigger>' syntax by tweaking the code a bit.

// Author:
//   MattSJohnston
var Status;

module.exports = function(robot) {
  var _;
  _ = require('underscore');
  robot.respond(/(away|a$|a ) ?(.*)?/i, function(msg) {
    var hb_status;
    hb_status = new Status(robot);
    hb_status.update_away(msg.message.user.name, msg.match[2]);
    return msg.send(msg.message.user.name + " is away.");
  });
  robot.respond(/(status|s)( |$)(.*)?/i, function(msg) {
    var hb_status;
    hb_status = new Status(robot);
    if (msg.match[3] == null) {
      hb_status.remove_status(msg.message.user.name);
      return msg.send(msg.message.user.name + " has no more status.");
    } else if (_.any(_.values(_.pluck(robot.brain.users, 'name')), function(val) {
      return val.toLowerCase() === msg.match[3].toLowerCase();
    })) {
      if (hb_status.statuses_[msg.match[2].toLowerCase()] != null) {
        return msg.send(msg.match[3] + "'s status: " + hb_status.statuses_[msg.match[3].toLowerCase()]);
      } else {
        return msg.send(msg.match[3] + " has no status set");
      }
    } else {
      hb_status.update_status(msg.message.user.name, msg.match[3]);
      return msg.send(msg.message.user.name + " has a new status.");
    }
  });
  robot.respond(/statuses?/i, function(msg) {
    var hb_status, message, s, user;
    hb_status = new Status(robot);
    message = (function() {
      var ref, results;
      ref = hb_status.statuses_;
      results = [];
      for (user in ref) {
        s = ref[user];
        results.push(`${user}: ${s}`);
      }
      return results;
    })();
    return msg.send(message.join("\n"));
  });
  robot.respond(/(return|r$|r ) ?(.*)?/i, function(msg) {
    var hb_status;
    hb_status = new Status(robot);
    hb_status.update_away(msg.message.user.name, null);
    return msg.send(msg.message.user.name + " has returned.");
  });
  return robot.hear(/(^\w+\s?\w+\s?\w+):/i, function(msg) {
    var hb_status, mention;
    hb_status = new Status(robot);
    mention = msg.match[1];
    if (hb_status.aways_[mention.toLowerCase()] != null) {
      return msg.reply(mention + " is away: " + hb_status.aways_[mention.toLowerCase()]);
    }
  });
};

Status = class Status {
  constructor(robot) {
    var base, base1;
    if ((base = robot.brain.data).statuses == null) {
      base.statuses = {};
    }
    if ((base1 = robot.brain.data).aways == null) {
      base1.aways = {};
    }
    this.statuses_ = robot.brain.data.statuses;
    this.aways_ = robot.brain.data.aways;
  }

  update_status(name, message) {
    return this.statuses_[name.toLowerCase()] = message;
  }

  remove_status(name) {
    return delete this.statuses_[name.toLowerCase()];
  }

  update_away(name, message) {
    return this.aways_[name.toLowerCase()] = message;
  }

};
