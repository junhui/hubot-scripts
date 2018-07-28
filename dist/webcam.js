// Description:
//   Allows Hubot to retreive the latest webcam shot from a query using webcams.travel API

// Dependencies:
//   None

// Configuration:
//   WEBCAMS_API_TOKEN - sign up for an API key at http://www.webcams.travel/developers/signup

// Commands:
//   hubot webcam me <query>

// Notes:
//   none

// Author:
//   richarcher
var webcamOf;

module.exports = function(robot) {
  return robot.respond(/(webcam)( me)? (.*)/i, function(msg) {
    return webcamOf(msg, msg.match[3], function(url) {
      return msg.send(url);
    });
  });
};

webcamOf = function(msg, query, cb) {
  var auth_token, url;
  auth_token = process.env.WEBCAMS_API_TOKEN;
  if (typeof auth_token === 'undefined') {
    return cb("Error: WEBCAMS_API_TOKEN is undefined");
  } else {
    url = `http://api.webcams.travel/rest?method=wct.search.webcams&devid=${auth_token}&format=json&query=${query}`;
    return msg.http(url).get()(function(err, res, body) {
      var image, previews, response, webcam;
      response = JSON.parse(body);
      previews = (function() {
        var i, len, ref, results;
        ref = response.webcams.webcam;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          webcam = ref[i];
          results.push(webcam.preview_url);
        }
        return results;
      })();
      if (previews.length > 0) {
        image = msg.random(previews);
        return cb(image);
      } else {
        return cb(`Stop bugging me with searches for "${query}".`);
      }
    });
  }
};
