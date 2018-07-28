// Description:
//   Stagehand manages who is currently using your team's staging server

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   stagehand who [env] - Show who has booked the staging server and how much time they have left
//   stagehand book [env] [minutes] - Book the staging server and optionally specify usage time. Default is 30min
//   stagehand cancel [env] - Cancel the current booking

// Author:
//   tinifni
var Message, bookEnv, cancelBooking, status;

Message = class Message {
  constructor(env, minutes) {
    this.env = env;
    this.minutes = minutes;
  }

  getEnv() {
    if (this.env === void 0) {
      return 'staging';
    } else {
      return this.env;
    }
  }

  getMinutes() {
    if (this.minutes === void 0) {
      return 30;
    } else {
      return Number(this.minutes);
    }
  }

};

bookEnv = function(data, user, minutes) {
  if (data.user !== user && new Date() < data.expires) {
    return false;
  }
  if (!(data.user === user && new Date() < data.expires)) {
    data.user = user;
    data.expires = new Date();
  }
  return data.expires = new Date(data.expires.getTime() + minutes * 1000 * 60);
};

status = function(env, data) {
  if (!(new Date() < data.expires)) {
    return env + ' is free for use.';
  }
  return data.user + ' has ' + env + ' booked for the next ' + Math.ceil((data.expires - new Date()) / (60 * 1000)) + ' minutes.';
};

cancelBooking = function(data) {
  return data.expires = new Date(0);
};

module.exports = function(robot) {
  robot.brain.on('loaded', () => {
    var base, env, i, len, ref, results;
    (base = robot.brain.data).stagehand || (base.stagehand = {});
    ref = ['staging', 'development', 'production'];
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      env = ref[i];
      results.push((function(env) {
        var base1;
        return (base1 = robot.brain.data.stagehand)[env] || (base1[env] = {
          user: "initial",
          expires: new Date(0)
        });
      })(env));
    }
    return results;
  });
  robot.respond(/stagehand book\s?([A-Za-z]+)*\s?(\d+)*/i, function(msg) {
    var env, message, minutes;
    message = new Message(msg.match[1], msg.match[2]);
    env = message.getEnv();
    minutes = message.getMinutes();
    bookEnv(robot.brain.data.stagehand[env], msg.message.user.name, minutes);
    return msg.send(status(env, robot.brain.data.stagehand[env]));
  });
  robot.respond(/stagehand who\s?([A-Za-z]+)*/i, function(msg) {
    var env, message;
    message = new Message(msg.match[1]);
    env = message.getEnv();
    return msg.send(status(env, robot.brain.data.stagehand[env]));
  });
  return robot.respond(/stagehand cancel\s?([A-Za-z]+)*/i, function(msg) {
    var env, message;
    message = new Message(msg.match[1]);
    env = message.getEnv();
    cancelBooking(robot.brain.data.stagehand[env]);
    return msg.send(status(env, robot.brain.data.stagehand[env]));
  });
};
