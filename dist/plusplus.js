// Description:
//   Give or take away points. Keeps track and even prints out graphs.

// Dependencies:
//   "underscore": ">= 1.0.0"
//   "clark": "0.0.6"

// Configuration:

// Commands:
//   <name>++
//   <name>--
//   hubot score <name>
//   hubot top <amount>
//   hubot bottom <amount>

// Author:
//   ajacksified
var ScoreKeeper, _, clark;

_ = require("underscore");

clark = require("clark").clark;

ScoreKeeper = class ScoreKeeper {
  constructor(robot1) {
    this.robot = robot1;
    this.cache = {
      scoreLog: {},
      scores: {}
    };
    this.robot.brain.on('loaded', () => {
      var base, base1;
      (base = this.robot.brain.data).scores || (base.scores = {});
      (base1 = this.robot.brain.data).scoreLog || (base1.scoreLog = {});
      this.cache.scores = this.robot.brain.data.scores;
      return this.cache.scoreLog = this.robot.brain.data.scoreLog;
    });
  }

  getUser(user) {
    var base;
    (base = this.cache.scores)[user] || (base[user] = 0);
    return user;
  }

  saveUser(user, from) {
    this.saveScoreLog(user, from);
    this.robot.brain.data.scores[user] = this.cache.scores[user];
    this.robot.brain.data.scoreLog[from] = this.cache.scoreLog[from];
    this.robot.brain.emit('save', this.robot.brain.data);
    return this.cache.scores[user];
  }

  add(user, from) {
    if (this.validate(user, from)) {
      user = this.getUser(user);
      this.cache.scores[user]++;
      return this.saveUser(user, from);
    }
  }

  subtract(user, from) {
    if (this.validate(user, from)) {
      user = this.getUser(user);
      this.cache.scores[user]--;
      return this.saveUser(user, from);
    }
  }

  scoreForUser(user) {
    user = this.getUser(user);
    return this.cache.scores[user];
  }

  saveScoreLog(user, from) {
    if (typeof this.cache.scoreLog[from] !== "object") {
      this.cache.scoreLog[from] = {};
    }
    return this.cache.scoreLog[from][user] = new Date();
  }

  isSpam(user, from) {
    var base, date, dateSubmitted, messageIsSpam;
    (base = this.cache.scoreLog)[from] || (base[from] = {});
    if (!this.cache.scoreLog[from][user]) {
      return false;
    }
    dateSubmitted = this.cache.scoreLog[from][user];
    date = new Date(dateSubmitted);
    messageIsSpam = date.setSeconds(date.getSeconds() + 30) > new Date();
    if (!messageIsSpam) {
      delete this.cache.scoreLog[from][user];
    }
    return messageIsSpam;
  }

  validate(user, from) {
    return user !== from && user !== "" && !this.isSpam(user, from);
  }

  length() {
    return this.cache.scoreLog.length;
  }

  top(amount) {
    var name, ref, score, tops;
    tops = [];
    ref = this.cache.scores;
    for (name in ref) {
      score = ref[name];
      tops.push({
        name: name,
        score: score
      });
    }
    return tops.sort(function(a, b) {
      return b.score - a.score;
    }).slice(0, amount);
  }

  bottom(amount) {
    var all;
    all = this.top(this.cache.scores.length);
    return all.sort(function(a, b) {
      return b.score - a.score;
    }).reverse().slice(0, amount);
  }

};

module.exports = function(robot) {
  var scoreKeeper;
  scoreKeeper = new ScoreKeeper(robot);
  robot.hear(/([\w\S]+)([\W\s]*)?(\+\+)$/i, function(msg) {
    var from, name, newScore;
    name = msg.match[1].trim().toLowerCase();
    from = msg.message.user.name.toLowerCase();
    newScore = scoreKeeper.add(name, from);
    if (newScore != null) {
      return msg.send(`${name} has ${newScore} points.`);
    }
  });
  robot.hear(/([\w\S]+)([\W\s]*)?(\-\-)$/i, function(msg) {
    var from, name, newScore;
    name = msg.match[1].trim().toLowerCase();
    from = msg.message.user.name.toLowerCase();
    newScore = scoreKeeper.subtract(name, from);
    if (newScore != null) {
      return msg.send(`${name} has ${newScore} points.`);
    }
  });
  robot.respond(/score (for\s)?(.*)/i, function(msg) {
    var name, score;
    name = msg.match[2].trim().toLowerCase();
    score = scoreKeeper.scoreForUser(name);
    return msg.send(`${name} has ${score} points.`);
  });
  return robot.respond(/(top|bottom) (\d+)/i, function(msg) {
    var amount, graphSize, i, j, message, ref, tops;
    amount = parseInt(msg.match[2]);
    message = [];
    tops = scoreKeeper[msg.match[1]](amount);
    for (i = j = 0, ref = tops.length - 1; (0 <= ref ? j <= ref : j >= ref); i = 0 <= ref ? ++j : --j) {
      message.push(`${i + 1}. ${tops[i].name} : ${tops[i].score}`);
    }
    if (msg.match[1] === "top") {
      graphSize = Math.min(tops.length, Math.min(amount, 20));
      message.splice(0, 0, clark(_.first(_.pluck(tops, "score"), graphSize)));
    }
    return msg.send(message.join("\n"));
  });
};
