//# Description
//   Show / Enter who is out of office

// Dependencies:
//   "moment": "x"
//   "underscore": "x"

// Configuration:

// Commands:
//   hubot I will be out [date]
//   hubot whoisout

// Notes:

// Author:
//  Contejious
var _, moment, plugin;

moment = require('moment');

_ = require('underscore');

plugin = function(robot) {
  robot.brain.on('loaded', () => {
    if (!_(robot.brain.data.outList).isArray()) {
      return robot.brain.data.outList = [];
    }
  });
  robot.respond(/whoisout/i, function(msg) {
    return msg.send(plugin.getAbsentees(robot, msg.match[1]));
  });
  robot.respond(/(?:I am|I'm|I will be) out +(.*)/i, function(msg) {
    var ref, thisDate;
    thisDate = plugin.parseDate((ref = msg.match[1]) != null ? ref.trim() : void 0);
    if (thisDate) {
      plugin.save(robot, thisDate, msg.message);
      return msg.send(`ok, ${msg.message.user.name} is out on ${thisDate}`);
    } else {
      return msg.send('unable to save date');
    }
  });
  return robot.respond(/when is (.*)/i, function(msg) {
    var ref;
    return msg.send(plugin.parseDate((ref = msg.match[1]) != null ? ref.trim() : void 0));
  });
};

plugin.parseDate = function(fuzzyDateString) {
  var date, day, days, plusOneWeek, week;
  fuzzyDateString = fuzzyDateString.toLowerCase();
  if (fuzzyDateString.split(" ")[0] === "next") {
    plusOneWeek = true;
    fuzzyDateString = fuzzyDateString.split(" ")[1];
  }
  day = 1000 * 60 * 60 * 24;
  week = day * 7;
  switch (fuzzyDateString) {
    case "tomorrow":
      return new Date((new Date).getTime() + day);
    case "today":
      return new Date();
    case "sunday":
    case "monday":
    case "tuesday":
    case "wednesday":
    case "thursday":
    case "friday":
    case "saturday":
      days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
      date = new Date();
      while (days[date.getDay()] !== fuzzyDateString) {
        date = new Date(date.getTime() + day);
      }
      if (plusOneWeek) {
        date = new Date(date.getTime() + week);
      }
      return date;
    default:
      if ((this.thisDate = moment(fuzzyDateString)).isValid()) {
        return this.thisDate.toDate();
      } else {
        return false;
      }
  }
};

plugin.save = function(robot, date, msg) {
  var userOutList, userVacation;
  userOutList = robot.brain.data.outList;
  userVacation = _(userOutList).find(function(item) {
    return item.name === msg.user.name;
  });
  if (userVacation === void 0) {
    return userOutList.push({
      name: msg.user.name,
      dates: [date]
    });
  } else {
    if (!_(userVacation.dates).some(function(item) {
      return (moment(item)).format('M/D/YY') === (moment(date)).format('M/D/YY');
    })) {
      return userVacation.dates.push(date);
    }
  }
};

plugin.getAbsentees = function(robot, targetDate) {
  var names;
  if (targetDate == null) {
    targetDate = new Date();
  }
  if (_(robot.brain.data.outList).isArray() && (robot.brain.data.outList.length > 0)) {
    names = [];
    _(robot.brain.data.outList).each(function(item) {
      if (_(item.dates).some(function(dt) {
        return (moment(dt)).format('M/D/YY') === (moment(targetDate)).format('M/D/YY');
      })) {
        return names.push(item.name);
      }
    });
    if (names.length > 0) {
      return names.join('\n');
    } else {
      return 'Nobody';
    }
  } else {
    return 'Nobody';
  }
};

module.exports = plugin;
