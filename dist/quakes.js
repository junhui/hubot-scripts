// Description:
//   Ask hubot about the recent earthquakes in the last (hour, day, week or month).

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot quakes (intensity|all|significant) (period) [limit]

// Author:
//   EnriqueVidal
var lookup_site;

lookup_site = "http://earthquake.usgs.gov";

module.exports = function(robot) {
  var check_for_rapture;
  robot.respond(/quakes (([12](\.[05])?)|all|significant)? (hour|day|week|month)( \d+)?$/i, function(message) {
    return check_for_rapture(message, message.match[1], message.match[4], parseInt(message.match[5]));
  });
  return check_for_rapture = function(message, intensity, period, limit) {
    var build_time, rapture_url;
    rapture_url = [lookup_site, "earthquakes", "feed", "geojson", intensity, period].join('/');
    message.http(rapture_url).get()(function(error, response, body) {
      var count, i, len, list, quake, results, time, url;
      if (error) {
        return message.send('Sorry, something went wrong');
      }
      list = JSON.parse(body).features;
      count = 0;
      results = [];
      for (i = 0, len = list.length; i < len; i++) {
        quake = list[i];
        count++;
        quake = quake.properties;
        time = build_time(quake);
        url = quake.url;
        message.send(`Magnitude: ${quake.mag}, Location: ${quake.place}, Time: ${time} - ${url}`);
        if (count === limit) {
          break;
        } else {
          results.push(void 0);
        }
      }
      return results;
    });
    return build_time = function(object) {
      var time;
      time = new Date(object.time * 1000);
      return [time.getHours(), time.getMinutes(), time.getSeconds()].join(':');
    };
  };
};
