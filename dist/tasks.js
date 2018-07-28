// Description:
//   Allows tasks (TODOs) to be added to Hubot

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot task add <task> - Add a task
//   hubot task list tasks - List the tasks
//   hubot task delete <task number> - Delete a task

// Author:
//   Crofty
var Tasks;

Tasks = class Tasks {
  constructor(robot1) {
    this.robot = robot1;
    this.cache = [];
    this.robot.brain.on('loaded', () => {
      if (this.robot.brain.data.tasks) {
        return this.cache = this.robot.brain.data.tasks;
      }
    });
  }

  nextTaskNum() {
    var maxTaskNum;
    maxTaskNum = this.cache.length ? Math.max.apply(Math, this.cache.map(function(n) {
      return n.num;
    })) : 0;
    maxTaskNum++;
    return maxTaskNum;
  }

  add(taskString) {
    var task;
    task = {
      num: this.nextTaskNum(),
      task: taskString
    };
    this.cache.push(task);
    this.robot.brain.data.tasks = this.cache;
    return task;
  }

  all() {
    return this.cache;
  }

  deleteByNumber(num) {
    var index, task;
    index = this.cache.map(function(n) {
      return n.num;
    }).indexOf(parseInt(num));
    task = this.cache.splice(index, 1)[0];
    this.robot.brain.data.tasks = this.cache;
    return task;
  }

};

module.exports = function(robot) {
  var tasks;
  tasks = new Tasks(robot);
  robot.respond(/(task add|add task) (.+?)$/i, function(msg) {
    var task;
    task = tasks.add(msg.match[2]);
    return msg.send(`Task added: #${task.num} - ${task.task}`);
  });
  robot.respond(/(task list|list tasks)/i, function(msg) {
    var i, len, num, ref, response, task;
    if (tasks.all().length > 0) {
      response = "";
      ref = tasks.all();
      for (num = i = 0, len = ref.length; i < len; num = ++i) {
        task = ref[num];
        response += `#${task.num} - ${task.task}\n`;
      }
      return msg.send(response);
    } else {
      return msg.send("There are no tasks");
    }
  });
  return robot.respond(/(task delete|delete task) #?(\d+)/i, function(msg) {
    var task, taskNum;
    taskNum = msg.match[2];
    task = tasks.deleteByNumber(taskNum);
    return msg.send(`Task deleted: #${task.num} - ${task.task}`);
  });
};
