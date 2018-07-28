// Description:
//   Geocode Addresses and return a Latitude and Longitude using Googles Geocode API

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot geocode me <string> - Geocodes the string and return latitude,longitude
//   hubot where is <string> - Geocodes the string and return latitude,longitude

// Author:
//   mattheath
var geocodeMe;

module.exports = function(robot) {
  robot.respond(/geocode( me)? (.*)/i, function(msg) {
    var query;
    query = msg.match[2];
    return geocodeMe(msg, query, function(text) {
      return msg.reply(text);
    });
  });
  return robot.respond(/where is (.*)/i, function(msg) {
    var query;
    query = msg.match[1];
    return geocodeMe(msg, query, function(text) {
      return msg.reply(text);
    });
  });
};

geocodeMe = function(msg, query, cb) {
  return msg.http("https://maps.googleapis.com/maps/api/geocode/json").header('User-Agent', 'Hubot Geocode Location Engine').query({
    address: query,
    sensor: false
  }).get()(function(err, res, body) {
    var location, ref, response;
    response = JSON.parse(body);
    if (!((ref = response.results) != null ? ref.length : void 0)) {
      return cb("No idea. Tried using a map? https://maps.google.com/");
    }
    location = response.results[0].geometry.location.lat + "," + response.results[0].geometry.location.lng;
    return cb("That's somewhere around " + location + " - https://maps.google.com/maps?q=" + location);
  });
};
