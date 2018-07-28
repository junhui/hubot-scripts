// Description:
//   Returns local time in given city.

// Dependencies:
//   None

// Configuration:
//   HUBOT_WWO_API_KEY
//   HUBOT_WWO_API_URL

// Commands:
//   hubot time in <city> - Get current time in city

// Notes
//   Request an WWO API KEY in http://www.worldweatheronline.com/
//   The url is likely to be something like http://api.worldweatheronline.com/free/v2/tz.ashx

//   City parameter can be:
//     city
//     city, country
//     ip address
//     latitude and longitude (in decimal)

// Author:
//   gtoroap

module.exports = function(robot) {
  return robot.respond(/time in (.*)/i, function(msg) {
    if (!process.env.HUBOT_WWO_API_KEY) {
      msg.send('Please, set HUBOT_WWO_API_KEY environment variable');
      return;
    }
    if (!process.env.HUBOT_WWO_API_URL) {
      msg.send('Please, set HUBOT_WWO_API_URL environment variable');
      return;
    }
    return msg.http(process.env.HUBOT_WWO_API_URL).query({
      q: msg.match[1],
      key: process.env.HUBOT_WWO_API_KEY,
      format: 'json'
    }).get()(function(err, res, body) {
      var city, currentTime, error, result;
      try {
        result = JSON.parse(body)['data'];
        city = result['request'][0]['query'];
        currentTime = result['time_zone'][0]['localtime'].slice(11);
        return msg.send(`Current time in ${city} ==> ${currentTime}`);
      } catch (error1) {
        error = error1;
        return msg.send("Sorry, no city found. Please, check your input and try it again");
      }
    });
  });
};
