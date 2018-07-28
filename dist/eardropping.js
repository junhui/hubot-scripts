// Description:
//   Add programmable interface to hubot.  Allow to run a hubot command
//   whenever something came up in the conversation. Optionally, multiple 
//   actions can be specified, with or without ordering.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot when you hear <pattern> do <something hubot does> - Setup a ear dropping event
//   hubot when you hear <pattern> do 1|<something hubot does>; 2|<some.... - Set up ear dropping with multiple actions and ordering
//   hubot stop ear dropping - Stop all ear dropping
//   hubot stop ear dropping on <pattern> - Remove a particular ear dropping event
//   hubot show ear dropping - Show what hubot is ear dropping on

// Author:
//   garylin
var EarDropping, TextMessage;

TextMessage = require('hubot').TextMessage;

EarDropping = class EarDropping {
  constructor(robot1) {
    this.robot = robot1;
    this.cache = [];
    this.robot.brain.on('loaded', () => {
      if (this.robot.brain.data.eardropping) {
        return this.cache = this.robot.brain.data.eardropping;
      }
    });
  }

  add(pattern, action, order) {
    var task;
    task = {
      key: pattern,
      task: action,
      order: order
    };
    this.cache.push(task);
    return this.robot.brain.data.eardropping = this.cache;
  }

  all() {
    return this.cache;
  }

  deleteByPattern(pattern) {
    this.cache = this.cache.filter(function(n) {
      return n.key !== pattern;
    });
    return this.robot.brain.data.eardropping = this.cache;
  }

  deleteAll() {
    this.cache = [];
    return this.robot.brain.data.eardropping = this.cache;
  }

};

module.exports = function(robot) {
  var earDropping;
  earDropping = new EarDropping(robot);
  robot.respond(/when you hear (.+?) do (.+?)$/i, function(msg) {
    var i, key, len, ref, task_raw, task_split;
    key = msg.match[1];
    ref = msg.match[2].split(";");
    for (i = 0, len = ref.length; i < len; i++) {
      task_raw = ref[i];
      task_split = task_raw.split("|");
      // If it's a single task, don't add an "order" property
      if (!task_split[1]) {
        earDropping.add(key, task_split[0]);
      } else {
        earDropping.add(key, task_split[1], task_split[0]);
      }
    }
    return msg.send(`I am now ear dropping for ${key}. Hehe.`);
  });
  robot.respond(/stop ear *dropping$/i, function(msg) {
    earDropping.deleteAll();
    return msg.send('Okay, fine. :( I will keep my ears shut.');
  });
  robot.respond(/stop ear *dropping (for|on) (.+?)$/i, function(msg) {
    var pattern;
    pattern = msg.match[2];
    earDropping.deleteByPattern(pattern);
    return msg.send(`Okay, I will ignore ${pattern}`);
  });
  robot.respond(/show ear *dropping/i, function(msg) {
    var i, len, ref, response, task;
    response = "\n";
    ref = earDropping.all();
    for (i = 0, len = ref.length; i < len; i++) {
      task = ref[i];
      response += `${task.key} -> ${task.task}\n`;
    }
    return msg.send(response);
  });
  return robot.hear(/(.+)/i, function(msg) {
    var i, j, len, len1, results, robotHeard, task, tasks, tasksToRun;
    robotHeard = msg.match[1];
    tasks = earDropping.all();
    tasks.sort(function(a, b) {
      if (a.order >= b.order) {
        return 1;
      } else {
        return -1;
      }
    });
    tasksToRun = [];
    for (i = 0, len = tasks.length; i < len; i++) {
      task = tasks[i];
      if (new RegExp(task.key, "i").test(robotHeard)) {
        tasksToRun.push(task);
      }
    }
    tasksToRun.sort(function(a, b) {
      if (a.order >= b.order) {
        return 1;
      } else {
        return -1;
      }
    });
    results = [];
    for (j = 0, len1 = tasksToRun.length; j < len1; j++) {
      task = tasksToRun[j];
      if (robot.name !== msg.message.user.name && !(new RegExp(`^${robot.name}`, "i").test(robotHeard))) {
        results.push(robot.receive(new TextMessage(msg.message.user, `${robot.name}: ${task.task}`)));
      } else {
        results.push(void 0);
      }
    }
    return results;
  });
};
