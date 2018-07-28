// Description:
//   Updates from KickStarter project

// Configuration:
//   KICKSTARTER_PROJECT
//   KICKSTARTER_INTERVAL

// Commands:
//   hubot kickstarter start - Start the kickstarter update feed
//   hubot kickstarter change <mins> - Change the interval of kickstarter updates
//   hubot kickstarter stop - Stop the kickstarter update feed

// Author:
//   pksunkara
var changed, currency, percent, pledged, scrape;

module.exports = function(robot) {
  var init, interval, previous, setTimer, timer;
  init = false;
  timer = 0;
  interval = parseInt(process.env.KICKSTARTER_INTERVAL || 5);
  previous = {
    flag: false,
    percent: 0,
    pledged: 0
  };
  robot.respond(/kickstarter start/i, function(msg) {
    if (!init) {
      init = true;
      setTimer(interval, msg);
      return msg.send("Started the kickstarter update feed");
    } else {
      return msg.send("Its already running!");
    }
  });
  robot.respond(/kickstarter stop/i, function(msg) {
    if (init) {
      init = false;
      clearTimeout(timer);
      return msg.send("Stopped the kickstarter update feed");
    }
  });
  robot.respond(/kickstarter change ([1-9][0-9]*)/i, function(msg) {
    clearTimeout(timer);
    interval = parseInt(msg.match[1]);
    setTimer(interval, msg);
    return msg.send("Changed the kickstarter update interval");
  });
  return setTimer = function(interval, msg) {
    return timer = setTimeout(scrape, interval * 60 * 1000, robot, function(err, data) {
      if (!err && data) {
        setTimer(interval, msg);
        if (!previous.flag) {
          previous = {
            flag: true,
            percent: data.percent,
            pledged: data.pledged
          };
          return msg.send(`${currency(data.currency)} ${pledged(data.pledged)} from ${data.backers} backers (${percent(data.percent)})`);
        } else {
          if (previous.pledged < data.pledged) {
            msg.send(`${currency(data.currency)} ${pledged(data.pledged)} from ${data.backers} backers (${percent(data.percent)}) (${changed(previous.pledged, data.pledged)})`);
            if (previous.percent < 1 && data.percent > 1) {
              msg.send("HURRAY! We are funded successfully! PARTY TIME EVERYONE!");
            }
            previous.pledged = data.pledged;
            return previous.percent = data.percent;
          }
        }
      } else {
        return setTimer(0, msg);
      }
    });
  };
};

changed = function(p, d) {
  return Math.round(d - p);
};

pledged = function(p) {
  return Math.round(p).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

percent = function(t) {
  return `${Math.round(t * 10000) / 100} %`;
};

currency = function(c) {
  if (c === 'USD') {
    return "$";
  } else {
    return "£";
  }
};

scrape = function(robot, cb) {
  return robot.http(`http://www.kickstarter.com/projects/${process.env.KICKSTARTER_PROJECT}`).get()(function(err, res, body) {
    var b, c, p, t;
    if (err) {
      return cb(err);
    }
    b = body.match(/data-backers-count=\"([0-9]*)\"/);
    p = body.match(/data-pledged=\"([0-9]*.[0-9]*)\"/);
    c = body.match(/data-currency=\"([A-Z]{3})\"/);
    t = body.match(/data-percent-raised=\"([0-9]*.[0-9]*)\"/);
    return cb(null, {
      backers: b[1],
      pledged: p[1],
      currency: c[1],
      percent: t[1]
    });
  });
};
