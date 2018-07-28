// Description:
//   Allows Hubot to fetch statistics from Gaug.es

// Dependencies:
//   None

// Configuration:
//   HUBOT_GAUGES_TOKEN

// Commands:
//   hubot gauges for (today|yesterday) - Get views/people from today or yesterday
//   hubot gauges for YYYY-MM-DD - Get views/people for the specified date

// Notes:
//   Also you can trigger a event to call gauges in another script
//     Example:

//       module.exports = (robot) ->
//         robot.respond /emit gauges/i, (msg) ->
//            robot.emit "gauges", { user: msg.user, for: 'today' }

// Author:
//   tombell
var Gauges;

Gauges = class Gauges {
  constructor(robot1, token) {
    this.robot = robot1;
    this.token = token;
  }

  getViewsForToday(callback) {
    return this.getGauges(function(err, data) {
      if (err) {
        return callback(err);
      }
      return callback(null, data.gauges.map(function(g) {
        return {
          title: g.title,
          views: g.today.views,
          people: g.today.people
        };
      }));
    });
  }

  getViewsForYesterday(callback) {
    return this.getGauges(function(err, data) {
      if (err) {
        return callback(err);
      }
      return callback(null, data.gauges.map(function(g) {
        return {
          title: g.title,
          views: g.yesterday.views,
          people: g.yesterday.people
        };
      }));
    });
  }

  getViewsForDate(date, callback) {
    return this.getGauges(function(err, data) {
      var days, g, gauges, i, len, ref;
      if (err) {
        return callback(err);
      }
      gauges = [];
      ref = data.gauges;
      for (i = 0, len = ref.length; i < len; i++) {
        g = ref[i];
        days = g.recent_days.filter(function(d) {
          return d.date === date;
        });
        gauges.push(days.map(function(d) {
          return {
            title: g.title,
            views: d.views,
            people: d.people
          };
        }));
      }
      return callback(null, gauges);
    });
  }

  getGauges(callback) {
    return this.robot.http("https://secure.gaug.es/gauges").headers({
      "X-Gauges-Token": this.token
    }).get()(function(err, res, body) {
      var data;
      if (err) {
        return callback(err);
      }
      if (res.statusCode === 200) {
        try {
          data = JSON.parse(body);
          return callback(null, data);
        } catch (error) {
          err = error;
          return callback(err);
        }
      } else {
        return callback("Could not get gauges for today");
      }
    });
  }

};

module.exports = function(robot) {
  robot.respond(/gauges for (today|yesterday)/i, function(msg) {
    var day;
    day = msg.match[1];
    return robot.emit("gauges", {
      msg: msg,
      for: day
    });
  });
  robot.respond(/gauges for (\d{4}-\d{2}-\d{2})/i, function(msg) {
    var day;
    day = msg.match[1];
    return robot.emit("gauges", {
      msg: msg,
      for: 'data',
      day: day
    });
  });
  return robot.on("gauges", function(data) {
    var gauges, handler;
    gauges = new Gauges(robot, process.env.HUBOT_GAUGES_TOKEN);
    handler = function(err, list) {
      var g, i, len, results;
      if (err) {
        return data.msg.send(`An error occured: ${err}`);
      }
      results = [];
      for (i = 0, len = list.length; i < len; i++) {
        g = list[i];
        results.push(data.msg.send(`${g.title}: Views ${g.views} People ${g.people}`));
      }
      return results;
    };
    switch (data.for) {
      case "today":
        return gauges.getViewsForToday(handler);
      case "yesterday":
        return gauges.getViewsForYesterday(handler);
      case "data":
        return gauges.getViewsForDate(data.day, handler);
    }
  });
};
