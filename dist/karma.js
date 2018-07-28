// Description:
//   Track arbitrary karma

// Dependencies:
//   None

// Configuration:
//   KARMA_ALLOW_SELF

// Commands:
//   <thing>++ - give thing some karma
//   <thing>-- - take away some of thing's karma
//   hubot karma <thing> - check thing's karma (if <thing> is omitted, show the top 5)
//   hubot karma empty <thing> - empty a thing's karma
//   hubot karma best - show the top 5
//   hubot karma worst - show the bottom 5

// Author:
//   stuartf
var Karma;

Karma = class Karma {
  constructor(robot1) {
    this.robot = robot1;
    this.cache = {};
    this.increment_responses = ["+1!", "gained a level!", "is on the rise!", "leveled up!"];
    this.decrement_responses = ["took a hit! Ouch.", "took a dive.", "lost a life.", "lost a level."];
    this.robot.brain.on('loaded', () => {
      if (this.robot.brain.data.karma) {
        return this.cache = this.robot.brain.data.karma;
      }
    });
  }

  kill(thing) {
    delete this.cache[thing];
    return this.robot.brain.data.karma = this.cache;
  }

  increment(thing) {
    var base;
    if ((base = this.cache)[thing] == null) {
      base[thing] = 0;
    }
    this.cache[thing] += 1;
    return this.robot.brain.data.karma = this.cache;
  }

  decrement(thing) {
    var base;
    if ((base = this.cache)[thing] == null) {
      base[thing] = 0;
    }
    this.cache[thing] -= 1;
    return this.robot.brain.data.karma = this.cache;
  }

  incrementResponse() {
    return this.increment_responses[Math.floor(Math.random() * this.increment_responses.length)];
  }

  decrementResponse() {
    return this.decrement_responses[Math.floor(Math.random() * this.decrement_responses.length)];
  }

  selfDeniedResponses(name) {
    return this.self_denied_responses = [`Hey everyone! ${name} is a narcissist!`, "I might just allow that next time, but no.", `I can't do that ${name}.`];
  }

  get(thing) {
    var k;
    k = this.cache[thing] ? this.cache[thing] : 0;
    return k;
  }

  sort() {
    var key, ref, s, val;
    s = [];
    ref = this.cache;
    for (key in ref) {
      val = ref[key];
      s.push({
        name: key,
        karma: val
      });
    }
    return s.sort(function(a, b) {
      return b.karma - a.karma;
    });
  }

  top(n = 5) {
    var sorted;
    sorted = this.sort();
    return sorted.slice(0, n);
  }

  bottom(n = 5) {
    var sorted;
    sorted = this.sort();
    return sorted.slice(-n).reverse();
  }

};

module.exports = function(robot) {
  var allow_self, karma;
  karma = new Karma(robot);
  allow_self = process.env.KARMA_ALLOW_SELF || "true";
  robot.hear(/(\S+[^+:\s])[: ]*\+\+(\s|$)/, function(msg) {
    var subject;
    subject = msg.match[1].toLowerCase();
    if (allow_self === true || msg.message.user.name.toLowerCase() !== subject) {
      karma.increment(subject);
      return msg.send(`${subject} ${karma.incrementResponse()} (Karma: ${karma.get(subject)})`);
    } else {
      return msg.send(msg.random(karma.selfDeniedResponses(msg.message.user.name)));
    }
  });
  robot.hear(/(\S+[^-:\s])[: ]*--(\s|$)/, function(msg) {
    var subject;
    subject = msg.match[1].toLowerCase();
    if (allow_self === true || msg.message.user.name.toLowerCase() !== subject) {
      karma.decrement(subject);
      return msg.send(`${subject} ${karma.decrementResponse()} (Karma: ${karma.get(subject)})`);
    } else {
      return msg.send(msg.random(karma.selfDeniedResponses(msg.message.user.name)));
    }
  });
  robot.respond(/karma empty ?(\S+[^-\s])$/i, function(msg) {
    var subject;
    subject = msg.match[1].toLowerCase();
    if (allow_self === true || msg.message.user.name.toLowerCase() !== subject) {
      karma.kill(subject);
      return msg.send(`${subject} has had its karma scattered to the winds.`);
    } else {
      return msg.send(msg.random(karma.selfDeniedResponses(msg.message.user.name)));
    }
  });
  robot.respond(/karma( best)?$/i, function(msg) {
    var i, item, len, rank, ref, verbiage;
    verbiage = ["The Best"];
    ref = karma.top();
    for (rank = i = 0, len = ref.length; i < len; rank = ++i) {
      item = ref[rank];
      verbiage.push(`${rank + 1}. ${item.name} - ${item.karma}`);
    }
    return msg.send(verbiage.join("\n"));
  });
  robot.respond(/karma worst$/i, function(msg) {
    var i, item, len, rank, ref, verbiage;
    verbiage = ["The Worst"];
    ref = karma.bottom();
    for (rank = i = 0, len = ref.length; i < len; rank = ++i) {
      item = ref[rank];
      verbiage.push(`${rank + 1}. ${item.name} - ${item.karma}`);
    }
    return msg.send(verbiage.join("\n"));
  });
  return robot.respond(/karma (\S+[^-\s])$/i, function(msg) {
    var match;
    match = msg.match[1].toLowerCase();
    if (match !== "best" && match !== "worst") {
      return msg.send(`"${match}" has ${karma.get(match)} karma.`);
    }
  });
};
