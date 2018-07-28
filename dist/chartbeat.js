// Description:
//   Display number of concurrent vistors to the specified site.

// Dependencies:
//   None

// Configuration:
//   HUBOT_CHARTBEAT_SITE
//   HUBOT_CHARTBEAT_SITES <comma separated string of all
//   HUBOT_CHARTBEAT_API_KEY <use global key for access to all sites>

// Commands:
//   hubot chart me - Returns active concurrent vistors from the default site specified.
//   hubot chart me <host> - Returns active concurrent vistors from the site specified.
//   hubot chart bomb - Returns active concurrent visitors from all sites.

// Notes:
//   How to find these settings:
//   Log into chartbeat then browse to
//   http://chartbeat.com/docs/api/explore

// Author:
//   Drew Delianides
var getChart;

getChart = function(msg, apiKey, site) {
  return msg.robot.http(`http://api.chartbeat.com/live/quickstats/v3/?apikey=${apiKey}&host=${site}`).get()(function(err, res, body) {
    var people, pluralize, response;
    if (res.statusCode !== 200) {
      msg.send("There was a problem with Chartbeat. Do you have access to this domain?");
      return;
    }
    response = JSON.parse(body);
    people = response.people || [];
    if (people < 1) {
      msg.send(`It doesn't appear that ${site} has any visitors right now`);
      return;
    }
    pluralize = people === 1 ? "person" : "people";
    return msg.send(`I see ${people} ${pluralize} on ${site} right now!`);
  });
};

module.exports = function(robot) {
  return robot.respond(/chart( me)? (.*)/i, function(msg) {
    var apiKey, i, len, results, site, sites;
    if (!process.env.HUBOT_CHARTBEAT_SITE && msg.match[2] === 'me') {
      msg.send("You need to set a default site");
      return;
    }
    if (!process.env.HUBOT_CHARTBEAT_SITES && msg.match[2] === 'bomb') {
      msg.send("You need to set a list of sites");
      return;
    }
    sites = (function() {
      switch (msg.match[2]) {
        case "me":
          return [process.env.HUBOT_CHARTBEAT_SITE];
        case "bomb":
          return process.env.HUBOT_CHARTBEAT_SITES.split(",");
        case "*":
          return process.env.HUBOT_CHARTBEAT_SITES.split(",");
        default:
          return [msg.match[2]];
      }
    })();
    apiKey = process.env.HUBOT_CHARTBEAT_API_KEY;
    results = [];
    for (i = 0, len = sites.length; i < len; i++) {
      site = sites[i];
      results.push(getChart(msg, apiKey, site));
    }
    return results;
  });
};
