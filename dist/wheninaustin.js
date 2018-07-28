// Description:
//   When in Austin

// Dependencies:
//   "jsdom": "0.2.14"

// Configuration:
//   None

// Commands:
//   hubot when in austin - Pull a random entry from wheninatx.tumblr.com

// Author:
//   elliotttf
var http, jsdom;

http = require('http');

jsdom = require('jsdom');

module.exports = function(robot) {
  return robot.respond(/when(\s)?in(\s)?austin/i, function(msg) {
    var options;
    options = {
      host: 'wheninatx.tumblr.com',
      port: 80,
      path: '/random'
    };
    // Random redirects us to another article, grab that url and respond.
    return http.get(options, function(res) {
      var location;
      location = res.headers.location;
      return jsdom.env(location, ['http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js'], function(errors, window) {
        return (function($) {
          var img, title;
          title = $('meta[property="og:title"]').attr('content');
          img = $('article p[align="center"] img').attr('src');
          return msg.send(title + ' ' + img);
        })(window.jQuery);
      });
    });
  });
};
