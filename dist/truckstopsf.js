// Description:
//   Find out what food trucks are at Truck Stop SF today
//   See http://truckstopsf.com

// Dependencies:
//   "underscore": "*"

// Configuration:
//   None

// Commands:
//   hubot truckstopsf - get just the names of the food trucks today
//   hubot truckstopsf details|deets - get food truck names and details
//   hubot truckstopsf! - get food truck names and details

// Author:
//   chris
var _, data_by_matcher;

_ = require('underscore');

data_by_matcher = function(input, matcher) {
  var get_data, match;
  get_data = (function() {
    var i, len, results;
    results = [];
    for (i = 0, len = input.length; i < len; i++) {
      match = input[i];
      results.push(match.match(matcher).slice(1));
    }
    return results;
  })();
  return _.flatten(get_data);
};

module.exports = function(robot) {
  return robot.respond(/truckstopsf\s?(!|details|deets)?/i, function(res) {
    var d, pstDate, today, utc;
    d = new Date();
    utc = d.getTime() + (d.getTimezoneOffset() * 60000);
    pstDate = new Date(utc + (3600000 * -8));
    today = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][pstDate.getDay()];
    if (today === 'Sunday' || today === 'Saturday') {
      return res.send("Sorry, the trucks aren't there on weekend");
    } else {
      return res.http("http://www.truckstopsf.com/").get()(function(err, _, body) {
        var match, matcher, matches, show_details, truck_details, trucks;
        if (err) {
          return res.send("Sorry, the trucks are out of gas or something.");
        }
        show_details = res.match[1] != null;
        body = body.replace(/\r|\n/g, ' ');
        matches = body.match(new RegExp(`<h3>${today}<\/h3>(.+?)<\/div>`, 'i'));
        if ((matches == null) || matches[1].match("There are no events") || matches[1].match("There are no food trucks to display")) {
          return res.send("Seems there may be no trucks today - check http://www.truckstopsf.com/");
        }
        matches = matches[1].match(new RegExp("<p><strong>.+?<\/strong>.+?<\/p>", 'gi'));
        matcher = show_details ? "<p><strong>(.+)<\/strong> - (.*)<\/p>" : "<p><strong>(.+)<\/strong>";
        matches = data_by_matcher(matches, matcher);
        if (matches != null) {
          trucks = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = matches.length; i < len; i++) {
              match = matches[i];
              results.push(match.replace("&#39;", "'").replace("&amp;", "&"));
            }
            return results;
          })();
          if (show_details) {
            truck_details = "Today's trucks:";
            while (trucks.length > 0) {
              truck_details += `\n* ${trucks.splice(0, 2).join(': ')}`;
            }
            return res.send(truck_details);
          } else {
            return res.send(`Today's trucks: ${trucks.slice(0, -1).join(', ')} and ${trucks[trucks.length - 1]}`);
          }
        } else {
          return res.send("Hmm, couldn't parse the trucks web page - try http://www.truckstopsf.com/");
        }
      });
    }
  });
};
