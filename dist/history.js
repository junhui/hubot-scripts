// Description:
//   Allows Hubot to store a recent chat history for services like IRC that
//   won't do it for you.

// Dependencies:
//   None

// Configuration:
//   HUBOT_HISTORY_LINES

// Commands:
//   hubot show [<lines> lines of] history - Shows <lines> of history, otherwise all history
//   hubot clear history - Clears the history

// Author:
//   wubr
var History, HistoryEntry;

History = class History {
  constructor(robot1, keep) {
    this.robot = robot1;
    this.keep = keep;
    this.cache = [];
    this.robot.brain.on('loaded', () => {
      if (this.robot.brain.data.history) {
        this.robot.logger.info("Loading saved chat history");
        return this.cache = this.robot.brain.data.history;
      }
    });
  }

  add(message) {
    this.cache.push(message);
    while (this.cache.length > this.keep) {
      this.cache.shift();
    }
    return this.robot.brain.data.history = this.cache;
  }

  show(lines) {
    var i, len, message, ref, reply;
    if (lines > this.cache.length) {
      lines = this.cache.length;
    }
    reply = 'Showing ' + lines + ' lines of history:\n';
    ref = this.cache.slice(-lines);
    for (i = 0, len = ref.length; i < len; i++) {
      message = ref[i];
      reply = reply + this.entryToString(message) + '\n';
    }
    return reply;
  }

  entryToString(event) {
    return '[' + event.hours + ':' + event.minutes + '] ' + event.name + ': ' + event.message;
  }

  clear() {
    this.cache = [];
    return this.robot.brain.data.history = this.cache;
  }

};

HistoryEntry = class HistoryEntry {
  constructor(name, message1) {
    this.name = name;
    this.message = message1;
    this.time = new Date();
    this.hours = this.time.getHours();
    this.minutes = this.time.getMinutes();
    if (this.minutes < 10) {
      this.minutes = '0' + this.minutes;
    }
  }

};

module.exports = function(robot) {
  var history, options;
  options = {
    lines_to_keep: process.env.HUBOT_HISTORY_LINES
  };
  if (!options.lines_to_keep) {
    options.lines_to_keep = 10;
  }
  history = new History(robot, options.lines_to_keep);
  robot.hear(/(.*)/i, function(msg) {
    var historyentry;
    historyentry = new HistoryEntry(msg.message.user.name, msg.match[1]);
    return history.add(historyentry);
  });
  robot.respond(/show ((\d+) lines of )?history/i, function(msg) {
    var lines;
    if (msg.match[2]) {
      lines = msg.match[2];
    } else {
      lines = history.keep;
    }
    return msg.send(history.show(lines));
  });
  return robot.respond(/clear history/i, function(msg) {
    msg.send("Ok, I'm clearing the history.");
    return history.clear();
  });
};
