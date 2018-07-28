// Description:
//   Allows good and bad things to be added to Hubot for sprint retrospective

// Dependencies:

// Configuration:

// Commands:
//   hubot good <good thing> - Add something good that happened this sprint
//   hubot bad <bad thing> - Add something bad that happened this sprint
//   hubot goodlist - List all good things that happened
//   hubot badlist - List all bad things that happened
//   hubot gooddel - Delete all good things that happened
//   hubot baddel - Delete all bad things that happened

// Author:
//   gabeguz
var GoodBad;

GoodBad = class GoodBad {
  constructor(robot1) {
    this.robot = robot1;
    this.goodcache = [];
    this.badcache = [];
    this.robot.brain.on('loaded', () => {
      if (this.robot.brain.data.good) {
        this.goodcache = this.robot.brain.data.good;
      }
      if (this.robot.brain.data.bad) {
        return this.badcache = this.robot.brain.data.bad;
      }
    });
  }

  nextGoodNum() {
    var maxGoodNum;
    maxGoodNum = this.goodcache.length ? Math.max.apply(Math, this.goodcache.map(function(n) {
      return n.num;
    })) : 0;
    maxGoodNum++;
    return maxGoodNum;
  }

  nextBadNum() {
    var maxBadNum;
    maxBadNum = this.badcache.length ? Math.max.apply(Math, this.badcache.map(function(n) {
      return n.num;
    })) : 0;
    maxBadNum++;
    return maxBadNum;
  }

  goodlist() {
    return this.goodcache;
  }

  badlist() {
    return this.badcache;
  }

  good(goodString) {
    var goodthing;
    goodthing = {
      num: this.nextGoodNum(),
      good: goodString
    };
    this.goodcache.push(goodthing);
    this.robot.brain.data.good = this.goodcache;
    return goodthing;
  }

  bad(badString) {
    var badthing;
    badthing = {
      num: this.nextBadNum(),
      bad: badString
    };
    this.badcache.push(badthing);
    this.robot.brain.data.bad = this.badcache;
    return badthing;
  }

  gooddel() {
    this.goodcache = [];
    return this.robot.brain.data.good = this.goodcache;
  }

  baddel() {
    this.badcache = [];
    return this.robot.brain.data.bad = this.badcache;
  }

};

module.exports = function(robot) {
  var goodbad;
  goodbad = new GoodBad(robot);
  robot.respond(/(good) (.+?)$/i, function(msg) {
    var good, message;
    message = `${msg.message.user.name}: ${msg.match[2]}`;
    good = goodbad.good(message);
    return msg.send("The sprint is thriving!");
  });
  robot.respond(/(bad) (.+?)$/i, function(msg) {
    var bad, message;
    message = `${msg.message.user.name}: ${msg.match[2]}`;
    bad = goodbad.bad(message);
    return msg.send("The sprint is festering...");
  });
  robot.respond(/(goodlist)/i, function(msg) {
    var good, i, len, num, ref, response;
    if (goodbad.goodlist().length > 0) {
      response = "";
      ref = goodbad.goodlist();
      for (num = i = 0, len = ref.length; i < len; num = ++i) {
        good = ref[num];
        response += `#${good.num} - ${good.good}\n`;
      }
      return msg.send(response);
    } else {
      return msg.send("Nothing good happened.");
    }
  });
  robot.respond(/(badlist)/i, function(msg) {
    var bad, i, len, num, ref, response;
    if (goodbad.badlist().length > 0) {
      response = "";
      ref = goodbad.badlist();
      for (num = i = 0, len = ref.length; i < len; num = ++i) {
        bad = ref[num];
        response += `#${bad.num} - ${bad.bad}\n`;
      }
      return msg.send(response);
    } else {
      return msg.send("Nothing bad happened.");
    }
  });
  robot.respond(/(gooddel)/i, function(msg) {
    goodbad.gooddel();
    return msg.send("Good things deleted.");
  });
  return robot.respond(/(baddel)/i, function(msg) {
    goodbad.baddel();
    return msg.send("Bad things deleted.");
  });
};
