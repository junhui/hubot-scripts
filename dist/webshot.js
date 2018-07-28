// Description:
//   Capture a webpage as an image using the bluga.net Easythumb API. API user and key needed from http://webthumb.bluga.net/api

// Dependencies:
//   "hashlib": "1.0.1"

// Configuration:
//   HUBOT_WEBTHUMB_USER
//   HUBOT_WEBTHUMB_API_KEY

// Commands:
//   hubot webshot me <url> - Captures the given url as an image.

// Author:
//   carsonmcdonald
var hashlib, webthumbhash;

hashlib = require('hashlib');

module.exports = function(robot) {
  return robot.respond(/webshot( me)? (.*)/i, function(msg) {
    var url;
    if (process.env.HUBOT_WEBTHUMB_USER && process.env.HUBOT_WEBTHUMB_API_KEY) {
      url = msg.match[2];
      console.log(url);
      return msg.send('http://webthumb.bluga.net/easythumb.php?user=' + process.env.HUBOT_WEBTHUMB_USER + '&url=' + encodeURIComponent(url) + '&size=large&hash=' + webthumbhash(process.env.HUBOT_WEBTHUMB_API_KEY, url) + '&cache=14#.jpeg');
    }
  });
};

webthumbhash = (apikey, url) => {
  var day, month, now, ref, ref1;
  now = new Date;
  now = new Date(now.getTime() - (now.getTimezoneOffset() * 1000));
  month = ((ref = now.getUTCMonth() < 9) != null ? ref : {
    '0': ''
  }) + (now.getUTCMonth() + 1);
  day = ((ref1 = now.getUTCDate() < 10) != null ? ref1 : {
    '0': ''
  }) + now.getUTCDate();
  return hashlib.md5(now.getUTCFullYear().toString() + month + day + url + apikey);
};
