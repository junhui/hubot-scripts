// Description:
//   Forgetful? Add reminders!

// Dependencies:
//   "chrono-node": "^0.1.10"
//   "moment": "^2.8.1"
//   "lodash": "^2.4.1"

// Configuration:
//   None

// Commands:
//   hubot remind me (on <date>|in <time>) to <action> - Set a reminder in <time> to do an <action> <time> is in the format 1 day, 2 hours, 5 minutes etc. Time segments are optional, as are commas
//   hubot delete reminder <action> - Delete reminder matching <action> (exact match required)
//   hubot show reminders

// Author:
//   whitman
//   jtwalters
var Reminder, Reminders, _, chrono, moment, timeoutIds;

_ = require('lodash');

moment = require('moment');

chrono = require('chrono-node');

timeoutIds = {};

Reminders = class Reminders {
  constructor(robot1) {
    this.robot = robot1;
    this.cache = [];
    this.currentTimeout = null;
    // Load reminders from brain, on loaded event
    this.robot.brain.on('loaded', () => {
      if (this.robot.brain.data.reminders) {
        this.cache = _.map(this.robot.brain.data.reminders, function(item) {
          return new Reminder(item);
        });
        console.log(`loaded ${this.cache.length} reminders`);
        return this.queue();
      }
    });
    // Persist reminders to the brain, on save event
    this.robot.brain.on('save', () => {
      return this.robot.brain.data.reminders = this.cache;
    });
  }

  add(reminder) {
    this.cache.push(reminder);
    this.cache.sort(function(a, b) {
      return a.due - b.due;
    });
    return this.queue();
  }

  removeFirst() {
    var reminder;
    reminder = this.cache.shift();
    return reminder;
  }

  queue() {
    var duration, extendTimeout, now, reminder, trigger;
    if (this.cache.length === 0) {
      return;
    }
    now = (new Date).getTime();
    trigger = () => {
      var reminder;
      reminder = this.removeFirst();
      this.robot.reply(reminder.msg_envelope, 'you asked me to remind you to ' + reminder.action);
      return this.queue();
    };
    // setTimeout uses a 32-bit INT
    extendTimeout = function(timeout, callback) {
      if (timeout > 0x7FFFFFFF) {
        return setTimeout(function() {
          return extendTimeout(timeout - 0x7FFFFFFF, callback);
        }, 0x7FFFFFFF);
      } else {
        return setTimeout(callback, timeout);
      }
    };
    reminder = this.cache[0];
    duration = reminder.due - now;
    if (duration < 0) {
      duration = 0;
    }
    clearTimeout(timeoutIds[reminder]);
    timeoutIds[reminder] = extendTimeout(reminder.due - now, trigger);
    return console.log(`reminder set with duration of ${duration}`);
  }

};

Reminder = class Reminder {
  constructor(data) {
    var matches, pattern, period, periods;
    ({msg_envelope: this.msg_envelope, action: this.action, time: this.time, due: this.due} = data);
    if (this.time && !this.due) {
      this.time.replace(/^\s+|\s+$/g, '');
      periods = {
        weeks: {
          value: 0,
          regex: "weeks?"
        },
        days: {
          value: 0,
          regex: "days?"
        },
        hours: {
          value: 0,
          regex: "hours?|hrs?"
        },
        minutes: {
          value: 0,
          regex: "minutes?|mins?"
        },
        seconds: {
          value: 0,
          regex: "seconds?|secs?"
        }
      };
      for (period in periods) {
        pattern = new RegExp('^.*?([\\d\\.]+)\\s*(?:(?:' + periods[period].regex + ')).*$', 'i');
        matches = pattern.exec(this.time);
        if (matches) {
          periods[period].value = parseInt(matches[1]);
        }
      }
      this.due = (new Date).getTime();
      this.due += ((periods.weeks.value * 604800) + (periods.days.value * 86400) + (periods.hours.value * 3600) + (periods.minutes.value * 60) + periods.seconds.value) * 1000;
    }
  }

  formatDue() {
    var dueDate, duration;
    dueDate = new Date(this.due);
    duration = dueDate - new Date;
    if (duration > 0 && duration < 86400000) {
      return 'in ' + moment.duration(duration).humanize();
    } else {
      return 'on ' + moment(dueDate).format("dddd, MMMM Do YYYY, h:mm:ss a");
    }
  }

};

module.exports = function(robot) {
  var reminders;
  reminders = new Reminders(robot);
  robot.respond(/show reminders$/i, function(msg) {
    var i, len, ref, reminder, text;
    text = '';
    ref = reminders.cache;
    for (i = 0, len = ref.length; i < len; i++) {
      reminder = ref[i];
      text += `${reminder.action} ${reminder.formatDue()}\n`;
    }
    return msg.send(text);
  });
  robot.respond(/delete reminder (.+)$/i, function(msg) {
    var prevLength, query;
    query = msg.match[1];
    prevLength = reminders.cache.length;
    reminders.cache = _.reject(reminders.cache, {
      action: query
    });
    reminders.queue();
    if (reminders.cache.length !== prevLength) {
      return msg.send(`Deleted reminder ${query}`);
    }
  });
  return robot.respond(/remind me (in|on) (.+?) to (.*)/i, function(msg) {
    var action, due, options, reminder, time, type;
    type = msg.match[1];
    time = msg.match[2];
    action = msg.match[3];
    options = {
      msg_envelope: msg.envelope,
      action: action,
      time: time
    };
    if (type === 'on') {
      // parse the date (convert to timestamp)
      due = chrono.parseDate(time).getTime();
      if (due.toString() !== 'Invalid Date') {
        options.due = due;
      }
    }
    reminder = new Reminder(options);
    reminders.add(reminder);
    return msg.send(`I'll remind you to ${action} ${reminder.formatDue()}`);
  });
};
