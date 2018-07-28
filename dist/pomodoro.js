// Description:
//   Hubot's pomodoro timer

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot start pomodoro - start a new pomodoro
//   hubot start pomodoro <time> - start a new pomodoro with a duration of <time> minutes
//   hubot stop pomodoro - stop a pomodoro
//   hubot pomodoro? - shows the details of the current pomodoro
//   hubot total pomodoros - shows the number of the total completed pomodoros

// Author:
//   mcollina
var currentPomodoro, defaultLength;

currentPomodoro = null;

defaultLength = 25;

module.exports = function(robot) {
  var base;
  (base = robot.brain.data).pomodoros || (base.pomodoros = 0);
  robot.respond(/start pomodoro ?(\d+)?/i, function(msg) {
    if (currentPomodoro != null) {
      msg.send("Pomodoro already started");
      return;
    }
    currentPomodoro = {};
    currentPomodoro.func = function() {
      msg.send("Pomodoro completed!");
      currentPomodoro = null;
      return robot.brain.data.pomodoros += 1;
    };
    currentPomodoro.time = new Date();
    currentPomodoro.length = defaultLength;
    if (msg.match[1] != null) {
      currentPomodoro.length = parseInt(msg.match[1]);
    }
    msg.send("Pomodoro started!");
    return currentPomodoro.timer = setTimeout(currentPomodoro.func, currentPomodoro.length * 60 * 1000);
  });
  robot.respond(/pomodoro\?/i, function(msg) {
    var minutes;
    if (currentPomodoro == null) {
      msg.send("You have not started a pomodoro");
      return;
    }
    minutes = currentPomodoro.time.getTime() + currentPomodoro.length * 60 * 1000;
    minutes -= new Date().getTime();
    minutes = Math.round(minutes / 1000 / 60);
    return msg.send(`There are still ${minutes} minutes in this pomodoro`);
  });
  robot.respond(/stop pomodoro/i, function(msg) {
    if (currentPomodoro == null) {
      msg.send("You have not started a pomodoro");
      return;
    }
    clearTimeout(currentPomodoro.timer);
    currentPomodoro = null;
    return msg.send("Pomodoro stopped!");
  });
  return robot.respond(/total pomodoros/i, function(msg) {
    return msg.send(`You have completed ${robot.brain.data.pomodoros} pomodoros`);
  });
};
