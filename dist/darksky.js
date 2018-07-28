// Description
//   Grabs the current forecast from Dark Sky

// Dependencies
//   None

// Configuration
//   HUBOT_DARK_SKY_API_KEY
//   HUBOT_DARK_SKY_DEFAULT_LOCATION
//   HUBOT_DARK_SKY_UNITS (optional - us, si, ca, or uk)

// Commands:
//   hubot weather - Get the weather for HUBOT_DARK_SKY_DEFAULT_LOCATION
//   hubot weather <location> - Get the weather for <location>

// Notes:
//   If HUBOT_DARK_SKY_DEFAULT_LOCATION is blank, weather commands without a location will be ignored

// Author:
//   kyleslattery
var darkSkyMe;

module.exports = function(robot) {
  return robot.respond(/weather ?(.+)?/i, function(msg) {
    var googleurl, location, q;
    location = msg.match[1] || process.env.HUBOT_DARK_SKY_DEFAULT_LOCATION;
    if (!location) {
      return;
    }
    googleurl = "http://maps.googleapis.com/maps/api/geocode/json";
    q = {
      sensor: false,
      address: location
    };
    return msg.http(googleurl).query(q).get()(function(err, res, body) {
      var lat, lng, result;
      result = JSON.parse(body);
      if (result.results.length > 0) {
        lat = result.results[0].geometry.location.lat;
        lng = result.results[0].geometry.location.lng;
        return darkSkyMe(msg, lat, lng, function(darkSkyText) {
          var response;
          response = `Weather for ${result.results[0].formatted_address}. ${darkSkyText}`;
          return msg.send(response);
        });
      } else {
        return msg.send(`Couldn't find ${location}`);
      }
    });
  });
};

darkSkyMe = function(msg, lat, lng, cb) {
  var url;
  url = `https://api.forecast.io/forecast/${process.env.HUBOT_DARK_SKY_API_KEY}/${lat},${lng}/`;
  if (process.env.HUBOT_DARK_SKY_UNITS) {
    url += `?units=${process.env.HUBOT_DARK_SKY_UNITS}`;
  }
  return msg.http(url).get()(function(err, res, body) {
    var celsius, fahrenheit, isFahrenheit, response, result;
    result = JSON.parse(body);
    if (result.error) {
      cb(`${result.error}`);
      return;
    }
    isFahrenheit = process.env.HUBOT_DARK_SKY_UNITS === "us";
    if (isFahrenheit) {
      fahrenheit = result.currently.temperature;
      celsius = (fahrenheit - 32) * (5 / 9);
    } else {
      celsius = result.currently.temperature;
      fahrenheit = celsius * (9 / 5) + 32;
    }
    response = `Currently: ${result.currently.summary} (${fahrenheit}°F/`;
    response += `${celsius}°C). `;
    response += `Today: ${result.hourly.summary} `;
    response += `Coming week: ${result.daily.summary}`;
    return cb(response);
  });
};
