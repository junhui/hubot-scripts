// Description:
//   Basic SendGrid statistics

// Dependencies:
//   None

// Configuration:
//   HUBOT_SENDGRID_USER to your SendGrid username (the same as you use to log in to sendgrid.com)
//   HUBOT_SENDGRID_KEY to your SendGrid password (the same as you use to log in to sendgrid.com)

// Commands:
//   hubot sendgrid total - total sendgrid usage for the account
//   hubot sendgrid today - Total usage for today
//   hubot sendgrid last X [days] - Total usage for the last X days
//   hubot sendgrid c[ategory] [total] <category> - Today or all time usage for the given category
//   hubot sendgrid c[ategory] last X [days] <category> - Total usage for the last X days for the given category
//   hubot sendgrid categories - list all categories for account

// Author:
//   sixfeetover
//   drdamour
var env, formatResponse, getTodayStr, query, stats;

env = process.env;

module.exports = function(robot) {
  if (env.HUBOT_SENDGRID_USER && env.HUBOT_SENDGRID_KEY) {
    robot.respond(/(sendgrid)( me)? today/i, function(msg) {
      var opts;
      opts = {
        start_date: getTodayStr
      };
      return query(msg, opts, function(json) {
        return msg.send(formatResponse(json[0], json[0].date));
      });
    });
    robot.respond(/(sendgrid)( me)? total/i, function(msg) {
      var opts;
      opts = {
        aggregate: 1
      };
      return query(msg, opts, function(json) {
        return msg.send(formatResponse(json, "All Time"));
      });
    });
    robot.respond(/(sendgrid)( me)? last (\d+)( days)?/i, function(msg) {
      var opts;
      opts = {
        days: msg.match[3],
        aggregate: 1
      };
      return query(msg, opts, function(json) {
        return msg.send(formatResponse(json, `Last ${opts.days} days`));
      });
    });
    robot.respond(/(sendgrid)( me)? c(ategory)?( total)? (.*)/i, function(msg) {
      var category, isAllTime, match, opts;
      category = msg.match[5].trim();
      match = /last (\d+)( days)?/i;
      //this response matches the next respond, so we need to short circuit it
      //anyone got a better way?
      if (match.test(category)) {
        return;
      }
      isAllTime = msg.match[4] === " total";
      msg.send(`Category: ${category}`);
      opts = {
        category: [category]
      };
      if (isAllTime) {
        opts.aggregate = 1;
      } else {
        opts.days = 0;
      }
      return query(msg, opts, function(json) {
        if (isAllTime) {
          //surprisingly when you set a cateogry, the aggregate is sent in an array
          return msg.send(formatResponse(json[0], "All Time"));
        } else {
          return msg.send(formatResponse(json[0], json[0].date));
        }
      });
    });
    robot.respond(/(sendgrid)( me)? c(ategory)? last (\d+)( days)? (.*)/i, function(msg) {
      var category, opts;
      category = msg.match[6].trim();
      msg.send(`Category: ${category}`);
      opts = {
        category: [category],
        aggregate: 1,
        days: msg.match[4]
      };
      return query(msg, opts, function(json) {
        //surprisingly when you set a cateogry, the aggregate is sent in an array
        return msg.send(formatResponse(json[0], `Last ${opts.days} days`));
      });
    });
    return robot.respond(/(sendgrid)( me)? categories/i, function(msg) {
      var opts;
      opts = {
        list: "true"
      };
      return query(msg, opts, function(json) {
        var cat, categories;
        msg.send(json[0].category);
        categories = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = json.length; i < len; i++) {
            cat = json[i];
            results.push(`  ${cat.category}`);
          }
          return results;
        })();
        return msg.send(categories.join('\n'));
      });
    });
  }
};

query = function(msg, opts, callback) {
  opts.api_user = env.HUBOT_SENDGRID_USER;
  opts.api_key = env.HUBOT_SENDGRID_KEY;
  return msg.http("https://sendgrid.com/api/stats.get.json").query(opts).get()(function(err, res, body) {
    var parsedBody;
    parsedBody = JSON.parse(body);
    if (parsedBody.error) {
      msg.send(parsedBody.error);
      return;
    }
    return callback(parsedBody);
  });
};

stats = {
  requests: 'Requests',
  delivered: 'Delivered',
  bounces: 'Bounces',
  repeat_bounces: 'Repeat Bounces',
  invalid_email: 'Invalid Emails',
  opens: 'Opens',
  unique_opens: 'Unique Opens',
  clicks: 'Clicks',
  unique_clicks: 'Unique Clicks',
  unsubscribes: 'Unsubscribes',
  repeat_unsubscribes: 'Repeat Unsubscribes',
  blocked: 'Blocked',
  spam_drop: 'Spam Drop',
  spamreports: 'Spam Reports',
  repeat_spamreports: 'Repeat Spam Reports'
};

formatResponse = (json, header) => {
  var description, details, stat;
  details = (function() {
    var results;
    results = [];
    for (stat in stats) {
      description = stats[stat];
      results.push(`  ${description}: ${json[stat]}`);
    }
    return results;
  })();
  details.unshift(`Stats for ${header}:`);
  return details.join("\n");
};

getTodayStr = () => {
  var cur_day, cur_month, cur_year, tdy_string, today;
  today = new Date();
  cur_day = today.getDate();
  cur_month = today.getMonth() + 1;
  cur_year = today.getFullYear();
  return tdy_string = cur_year + "-" + cur_month + "-" + cur_day;
};
