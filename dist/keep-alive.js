  // Description:
  //   keep-alive pings each url in the array every minute.
  //   This is specifically to keep certain heroku apps from going to sleep

  // Dependencies:
  //   None

  // Configuration:
  //   HUBOT_KEEP_ALIVE_FREQUENCY

  // Commands:
  //   hubot keep http://ninjas-20.herokuapp.com alive - Add inputted url to the collection of urls set to be pinged
  //   hubot don't keep http://ninjas-20.herokuapp.com alive - Remove inputted url to the collection of urls set to be pinged
  //   hubot what are you keeping alive - Show list of urls being kept alive

  // Author:
  //   maddox
var HTTP, URL, frequency, ping,
  indexOf = [].indexOf;

HTTP = require("http");

URL = require("url");

frequency = process.env.HUBOT_KEEP_ALIVE_FREQUENCY || 60000;

ping = function(url) {
  var options, parsedUrl, req;
  parsedUrl = URL.parse(url);
  options = {
    host: parsedUrl.host,
    port: 80,
    path: parsedUrl.path,
    method: 'GET'
  };
  req = HTTP.request(options, function(res) {
    var body;
    body = "";
    res.setEncoding("utf8");
    res.on("data", function(chunk) {
      return body += chunk;
    });
    return res.on("end", function() {
      var data;
      return data = {
        response: {
          body: body,
          status: res.statusCode
        }
      };
    });
  });
  req.on("error", function(e) {});
  return req.end();
};

module.exports = function(robot) {
  var keepAlive;
  keepAlive = function() {
    var base, e, i, len, ref, url;
    if ((base = robot.brain.data).keepalives == null) {
      base.keepalives = [];
    }
    ref = robot.brain.data.keepalives;
    for (i = 0, len = ref.length; i < len; i++) {
      url = ref[i];
      console.log(url);
      try {
        ping(url);
      } catch (error) {
        e = error;
        console.log("that probably isn't a url: " + url);
      }
    }
    return setTimeout((function() {
      return keepAlive();
    }), frequency);
  };
  keepAlive();
  robot.respond(/keep (.*) alive$/i, function(msg) {
    var base, url;
    url = msg.match[1];
    if ((base = robot.brain.data).keepalives == null) {
      base.keepalives = [];
    }
    if (indexOf.call(robot.brain.data.keepalives, url) >= 0) {
      return msg.send("I already am.");
    } else {
      robot.brain.data.keepalives.push(url);
      return msg.send("OK. I'll ping that url every " + frequency / 1000 + " seconds to make sure its alive.");
    }
  });
  robot.respond(/don'?t keep (.*) alive$/i, function(msg) {
    var base, url;
    url = msg.match[1];
    if ((base = robot.brain.data).keepalives == null) {
      base.keepalives = [];
    }
    robot.brain.data.keepalives.splice(robot.brain.data.keepalives.indexOf(url), 1);
    return msg.send("OK. I've removed that url from my list of urls to keep alive.");
  });
  return robot.respond(/what are you keeping alive/i, function(msg) {
    var base;
    if ((base = robot.brain.data).keepalives == null) {
      base.keepalives = [];
    }
    if (robot.brain.data.keepalives.length > 0) {
      return msg.send("These are the urls I'm keeping alive:\n" + robot.brain.data.keepalives.join('\n'));
    } else {
      return msg.send("I'm not currently keeping any urls alive. Why don't you add one?");
    }
  });
};
