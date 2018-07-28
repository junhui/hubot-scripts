// Description
//   Grab web screens/thumbs of URLs using the capgun.io service

//   Requires a CapGun API token to be set in the env var HUBOT_CAPGUN_TOKEN

// Dependencies:
//   none

// Configuration:
//   HUBOT_CAPGUN_TOKEN

// Commands:
//   hubot cap <url> - Get a web screen of the url

// Notes:
//   none

// Author:
//   monde
var Capgun;

module.exports = function(robot) {
  return robot.respond(/cap (.*)/i, function(msg) {
    return Capgun.start(msg, msg.match[1]);
  });
};

Capgun = {
  interval: 2500,
  token: process.env.HUBOT_CAPGUN_TOKEN,
  start: function(msg, url) {
    return this.submitOrder(msg, url);
  },
  submitOrder: function(msg, url) {
    var capgun, data;
    capgun = this;
    data = JSON.stringify({
      "url": url
    });
    return msg.http('https://api.capgun.io/v1/orders.json').headers({
      'Authorization': capgun.token,
      'Accept': 'application/json'
    }).post(data)(function(err, res, body) {
      var message, result;
      result = JSON.parse(body);
      if (err || res.statusCode !== 200) {
        message = result.message || "???";
        return msg.send("Capgun job failed with message '" + message + "', I'm bailing out!");
      } else {
        return setTimeout((function() {
          return capgun.checkJob(msg, url, result.order.id, 0);
        }), capgun.interval);
      }
    });
  },
  checkJob: function(msg, url, order_id, duration) {
    var capgun;
    capgun = this;
    if (duration > 90000) {
      return msg.send("Capgun job hung past 90 seconds for URL " + url + " , I'm bailing out!");
    } else {
      return msg.http('https://api.capgun.io/v1/orders/' + order_id + '.json').headers({
        'Authorization': capgun.token,
        'Accept': 'application/json'
      }).get()(function(err, res, body) {
        var result, state;
        result = JSON.parse(body);
        state = result.order.job.state;
        if (state.search(/failed/) >= 0) {
          return msg.send("Capgun order " + order_id + " failed for URL " + url);
        } else if (state.search(/completed/) >= 0) {
          return msg.send(result.order.asset_urls['xlarge']);
        } else {
          return setTimeout((function() {
            return capgun.checkJob(msg, url, result.order.id, duration + capgun.interval);
          }), capgun.interval);
        }
      });
    }
  }
};
