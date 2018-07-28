// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   HUBOT_WUNDERGROUND_API_KEY Sign up at http://www.wunderground.com/weather/api/.
//   HUBOT_WUNDERGROUND_USE_METRIC Set to arbitrary value to use forecasts with metric system units

// Commands:
//   hubot weather me <location> - short-term forecast
//   hubot radar me <location> - recent radar image
//   hubot satellite me <location> - get a recent satellite image
//   hubot weathercam me <location> - get a weather webcam image near location

// Notes:
//   location can be zip code, ICAO/IATA airport code, state/city (CA/San_Franciso).

// Author:
//   alexdean
var alternative_place, formatted_ttl, get_data, key_for, send_forecast, send_radar, send_satellite, send_webcam, ttl;

module.exports = function(robot) {
  robot.respond(/weather (me|at|for|in)? ?(.*)$/i, function(msg) {
    var location;
    location = msg.match[2];
    return get_data(robot, msg, location, 'forecast', location.replace(/\s/g, '_'), send_forecast, 60 * 60 * 2);
  });
  robot.respond(/radar (me|at|for|in)? ?(.*)$/i, function(msg) {
    var location;
    location = msg.match[2];
    return get_data(robot, msg, location, 'radar', location.replace(/\s/g, '_'), send_radar, 60 * 10);
  });
  robot.respond(/satellite (me|at|for|in)? ?(.*)$/i, function(msg) {
    var location;
    location = msg.match[2];
    return get_data(robot, msg, location, 'satellite', location.replace(/\s/g, '_'), send_satellite, 60 * 10);
  });
  return robot.respond(/weathercam (me|at|for|in)? ?(.*)$/i, function(msg) {
    var location;
    location = msg.match[2];
    return get_data(robot, msg, location, 'webcams', location.replace(/\s/g, '_'), send_webcam, 60 * 30);
  });
};

// check cache, get data, store data, invoke callback.
get_data = function(robot, msg, location, service, query, cb, lifetime, stack = 0) {
  var base, cache_key, data;
  // what redis key to use
  cache_key = key_for(service, location);
  (base = robot.brain.data).wunderground || (base.wunderground = {});
  data = robot.brain.data.wunderground[cache_key];
  if ((data != null) && ttl(data) <= 0) {
    //console.log 'needs refresh'
    robot.brain.data.wunderground[cache_key] = data = null;
  }
  if (data != null) {
    //console.log 'cache is valid'
    return cb(msg, location, data);
  } else {
    if (process.env.HUBOT_WUNDERGROUND_API_KEY == null) {
      msg.send("HUBOT_WUNDERGROUND_API_KEY is not set. Sign up at http://www.wunderground.com/weather/api/.");
      return;
    }
    // get new data
    return msg.http(`http://api.wunderground.com/api/${process.env.HUBOT_WUNDERGROUND_API_KEY}/${service}/q/${encodeURIComponent(query)}.json`).get()(function(err, res, body) {
      var alts, item, key, ref, ref1;
      // check for a non-200 response. cache it for some short amount of time && msg.send 'unavailable'
      data = JSON.parse(body);
      // probably an unknown place
      if (((ref = data.response) != null ? ref.error : void 0) != null) {
        return msg.send(data.response.error.description);
      // ambiguous place, multiple matches
      } else if (((ref1 = data.response) != null ? ref1.results : void 0) != null) {
        alts = (function() {
          var ref2, results;
          ref2 = data.response.results;
          results = [];
          for (key in ref2) {
            item = ref2[key];
            results.push(alternative_place(item));
          }
          return results;
        })();
        // we don't seem to have array.filter
        alts = (function() {
          var results;
          results = [];
          for (key in alts) {
            item = alts[key];
            if (item !== '') {
              results.push(item);
            }
          }
          return results;
        })();
        // if there's only 1 place, let's just get it.
        // stack: guard against infinite recursion
        if (alts.length === 1 && stack === 0) {
          return get_data(robot, msg, location, service, alts[0], cb, lifetime, 1);
        } else {
          return msg.send(`Possible matches for '${location}'.\n - ${alts.join('\n - ')}`);
        }
      } else {
        // looks good
        robot.brain.data.wunderground[cache_key] = data;
        robot.brain.data.wunderground[cache_key].retrieved = new Date;
        robot.brain.data.wunderground[cache_key].lifetime = lifetime;
        return cb(msg, location, robot.brain.data.wunderground[cache_key]);
      }
    });
  }
};

send_forecast = function(msg, location, data) {
  var report, useMetric;
  report = data.forecast.txt_forecast.forecastday[0];
  useMetric = process.env.HUBOT_WUNDERGROUND_USE_METRIC != null;
  return msg.send(`${report.title} in ${location}: ${(useMetric ? report.fcttext_metric : report.fcttext)} (${formatted_ttl(data)})`);
};

send_radar = function(msg, location, data) {
  return msg.send(`${data.radar.image_url}#.png`);
};

send_satellite = function(msg, location, data) {
  return msg.send(`${data.satellite.image_url}#.png`);
};

send_webcam = function(msg, location, data) {
  var cam;
  cam = msg.random(data.webcams);
  if (cam != null) {
    msg.send(`${cam.handle} in ${cam.city}, ${cam.state} (${formatted_ttl(data)})`);
    return msg.send(`${cam.CURRENTIMAGEURL}#.png`);
  } else {
    return msg.send(`No webcams near ${location}. (${formatted_ttl(data)})`);
  }
};

// quick normalization to reduce caching of redundant data
key_for = function(service, query) {
  return `${service}-${query.toLowerCase()}`;
};

formatted_ttl = function(data) {
  return parseInt(ttl(data) / 1000);
};

// how long till our cached data expires?
ttl = function(data) {
  var now, retrieved;
  now = new Date;
  if ((data.lifetime == null) || (data.retrieved == null)) {
    return -1;
  } else {
    retrieved = Date.parse(data.retrieved);
    return data.lifetime * 1000 - (now.getTime() - retrieved);
  }
};

alternative_place = function(item) {
  if (item.country !== 'US' || item.state === "" || item.city === "") {
    return '';
  }
  return `${item.state}/${item.city.replace(/\s/g, '_')}`;
};
