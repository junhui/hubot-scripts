// Description:
//   Show some help to git noobies

// Dependencies:
//   jsdom
//   jquery

// Configuration:
//   None

// Commands:
//   git help <topic>

// Author:
//   vquaiato, Jens Jahnke
var jsdom;

jsdom = require("jsdom").jsdom;

module.exports = function(robot) {
  return robot.respond(/git help (.+)$/i, function(msg) {
    var topic, url;
    topic = msg.match[1].toLowerCase();
    url = 'http://git-scm.com/docs/git-' + topic;
    return msg.http(url).get()(function(err, res, body) {
      var $, desc, name, window;
      window = (jsdom(body, null, {
        features: {
          FetchExternalResources: false,
          ProcessExternalResources: false,
          MutationEvents: false,
          QuerySelector: false
        }
      })).createWindow();
      $ = require("jquery").create(window);
      name = $.trim($('#header .sectionbody .paragraph').text());
      desc = $.trim($('#_synopsis + .verseblock > .content').text());
      if (name && desc) {
        msg.send(name);
        msg.send(desc);
        return msg.send(`See ${url} for details.`);
      } else {
        return msg.send(`No git help page found for ${topic}.`);
      }
    });
  });
};
