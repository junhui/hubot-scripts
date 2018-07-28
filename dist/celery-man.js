// Description:
//   Loads up Celery Man

// Dependencies:
//   None

// Configuration:
//   None

// Commands:

// Author:
//   danryan
var moretayne, tayne;

tayne = false;

moretayne = false;

module.exports = function(robot) {
  robot.respond(/.*celery\s?man/i, function(msg) {
    return msg.send("http://mlkshk.com/r/4SBP.gif");
  });
  robot.respond(/.*4d3d3d3/i, function(msg) {
    msg.send("4d3d3d3 ENGAGED");
    return msg.send("http://i.imgur.com/w1qQO.gif");
  });
  robot.respond(/.*add sequence:? oyster/i, function(msg) {
    return msg.send("http://i.imgur.com/9McEqKA.gif");
  });
  robot.respond(/.*oyster smiling/, function(msg) {
    // msg.send "http://i.imgur.com/e71P6.png"
    return msg.send("http://i.imgur.com/eq5v0RY.gif");
  });
  robot.respond(/do we have any new sequences/i, function(msg) {
    tayne = true;
    moretayne = true;
    msg.send("I have a BETA sequence I have been working on.");
    msg.send("Would you like to see it?");
    setTimeout((function() {
      return moretayne = false;
    }), 10000);
    return setTimeout((function() {
      return tayne = false;
    }), 10000);
  });
  robot.respond(/.*hat wobble/i, function(msg) {
    return msg.send("http://i.imgur.com/5kVq4.gif");
  });
  robot.respond(/.*flarhgunnstow/i, function(msg) {
    return msg.send("http://i.imgur.com/X0sNq.gif");
  });
  robot.respond(/.*nude tayne/, function(msg) {
    return msg.send("Not computing. Please repeat:");
  });
  robot.respond(/NUDE TAYNE/, function(msg) {
    return msg.send("http://i.imgur.com/yzLcf.png");
  });
  robot.hear(/yes/i, function(msg) {
    if (tayne && moretayne) {
      moretayne = false;
      return msg.send("http://i.imgur.com/h27BPKW.png");
    }
  });
  return robot.hear(/tayne/gi, function(msg) {
    if (tayne && !moretayne) {
      tayne = false;
      return msg.send("http://i.imgur.com/TrdLwoz.gif");
    }
  });
};
