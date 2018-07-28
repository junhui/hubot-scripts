// Description:
//   Tracks when stuff is due

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot deadlines - List what you have due
//   hubot add deadline 2011-10-30 Thing - Add a deadline for October 10, 2011
//   hubot remove deadline Thing - Remove a deadline named "Thing"
//   hubot clear deadlines - Remove all the deadlines

// Author:
//   jmhobbs
module.exports = function(robot) {
  robot.respond(/(create|add|set) deadline (\d\d\d\d-\d\d-\d\d) (.*) ?$/i, function(msg) {
    var base, due, what;
    due = msg.match[2];
    what = msg.match[3];
    if ((base = robot.brain.data).deadlines == null) {
      base.deadlines = [];
    }
    robot.brain.data.deadlines.push({
      what: what,
      due: due
    });
    return msg.send('Got it! "' + what + '" is due on ' + due);
  });
  robot.respond(/(clear|flush) deadlines/i, function(msg) {
    robot.brain.data.deadlines = [];
    return msg.send("Deadlines cleared. Go do whatever you want.");
  });
  robot.respond(/(delete|remove|complete) deadline (.*) ?$/i, function(msg) {
    var base, deadline, i, index_of, j, len, length_before, ref, what;
    what = msg.match[2];
    if ((base = robot.brain.data).deadlines == null) {
      base.deadlines = [];
    }
    length_before = robot.brain.data.deadlines.length;
    index_of = -1;
    ref = robot.brain.data.deadlines;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      deadline = ref[i];
      if (deadline.what === what) {
        index_of = i;
      }
    }
    if (-1 !== index_of) {
      robot.brain.data.deadlines.splice(index_of, 1);
    }
    if (length_before > robot.brain.data.deadlines.length) {
      return msg.send('Removed deadline "' + what + '", nice job!');
    } else {
      return msg.send('I couldn\'t find that deadline.');
    }
  });
  return robot.respond(/deadlines/i, function(msg) {
    var base, deadlines;
    if ((base = robot.brain.data).deadlines == null) {
      base.deadlines = [];
    }
    if (robot.brain.data.deadlines.length > 0) {
      deadlines = robot.brain.data.deadlines.map(function(deadline) {
        var days_passed, due_date, interval_string, today;
        today = new Date();
        due_date = new Date(deadline.due);
        days_passed = Math.round((due_date.getTime() - today.getTime()) / 86400000);
        interval_string = days_passed + ' days left';
        if (days_passed < 0) {
          interval_string = (-1 * days_passed) + ' days overdue';
        }
        if (days_passed === 0) {
          interval_string = 'due today';
        }
        return '"' + deadline.what + '" is due on ' + deadline.due + ' (' + interval_string + ')';
      });
      return msg.send("Here are your upcoming deadlines:\n\n" + deadlines.join("\n"));
    } else {
      return msg.send("I'm not currently tracking any deadlines. Why don't you add one?");
    }
  });
};
