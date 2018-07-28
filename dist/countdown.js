// Description
//   Set countdown date and retreive countdown (number of days remaining).

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   countdown set #meetupname# #datestring# e.g. countdown set punerbmeetup 21 Jan 2014
//   countdown [for] #meetupname# e.g. countdown punerbmeetup
//   countdown list 
//   countdown delete #meetupname# e.g. countdown delete seattlerbmeetup
//   countdown clear

// Notes:
//   None

// Author:
//   anildigital
module.exports = function(robot) {
  var getCountdownMsg;
  // Get countdown message
  getCountdownMsg = function(countdownKey) {
    var eventTime, gap, now;
    now = new Date();
    eventTime = new Date(robot.brain.data.countdown[countdownKey].date);
    gap = eventTime.getTime() - now.getTime();
    gap = Math.floor(gap / (1000 * 60 * 60 * 24));
    return `Only ${gap} days remaining till ${countdownKey}!`;
  };
  robot.hear(/countdown set (\w+) (.*)/i, function(msg) {
    var base, countdownKey, date, dateString, error;
    (base = robot.brain.data).countdown || (base.countdown = {});
    dateString = msg.match[2];
    try {
      date = new Date(dateString);
      if (date === "Invalid Date") {
        throw "Invalid date passed";
      }
      countdownKey = msg.match[1];
      robot.brain.data.countdown[countdownKey] = {
        "date": date.toDateString()
      };
      msg.send(`Countdown set for ${countdownKey} at ${date.toDateString()}`);
      if (robot.brain.data.countdown.hasOwnProperty(countdownKey)) {
        return msg.send(getCountdownMsg(countdownKey));
      }
    } catch (error1) {
      error = error1;
      console.log(error.message);
      return msg.send("Invalid date passed!");
    }
  });
  robot.hear(/countdown list/i, function(msg) {
    var countdownKey, countdowns, results;
    countdowns = robot.brain.data.countdown;
    results = [];
    for (countdownKey in countdowns) {
      if (countdowns.hasOwnProperty(countdownKey)) {
        results.push(msg.send(countdownKey + " -> " + new Date(countdowns[countdownKey].date).toDateString() + " -> " + getCountdownMsg(countdownKey)));
      } else {
        results.push(void 0);
      }
    }
    return results;
  });
  robot.hear(/(countdown)( for)? (.*)/, function(msg) {
    var countdownKey, countdowns;
    countdownKey = msg.match[3];
    countdowns = robot.brain.data.countdown;
    if (countdowns.hasOwnProperty(countdownKey)) {
      return msg.send(getCountdownMsg(countdownKey));
    }
  });
  robot.hear(/countdown clear/i, function(msg) {
    robot.brain.data.countdown = {};
    return msg.send("Countdowns cleared");
  });
  robot.hear(/countdown delete (.*)/i, function(msg) {
    var countdownKey;
    countdownKey = msg.match[1];
    if (robot.brain.data.countdown.hasOwnProperty(countdownKey)) {
      delete robot.brain.data.countdown[countdownKey];
      return msg.send(`Countdown for ${countdownKey} deleted.`);
    } else {
      return msg.send(`Countdown for ${countdownKey} does not exist!`);
    }
  });
  return robot.hear(/countdown set$|countdown help/i, function(msg) {
    msg.send("countdown set #meetupname# #datestring# e.g. countdown set PuneRubyMeetup 21 Jan 2014");
    msg.send("countdown [for] #meetupname# e.g. countdown PuneRubyMeetup");
    msg.send("countdown list");
    msg.send("countdown delete #meetupname# e.g. countdown delete HashTagMeetup");
    return msg.send("countdown clear");
  });
};
