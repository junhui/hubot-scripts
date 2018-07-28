// Description:
//   None

// Dependencies:
//   "jsdom": "0.2.14"

// Configuration:
//   None

// Commands:
//   hubot whatis <term> - search the term on urbandictionary.com and get a random popular definition for the term.

// Author:
//   Kevin Qiu

// FIXME merge with urban.coffee
var jsdom;

jsdom = require('jsdom').jsdom;

module.exports = function(robot) {
  return robot.respond(/whatis (.+)$/i, function(msg) {
    return msg.http('http://www.urbandictionary.com/define.php?term=' + (encodeURIComponent(msg.match[1]))).get()(function(err, res, body) {
      var $, definitions, msgText, window;
      window = (jsdom(body, null, {
        features: {
          FetchExternalResources: false,
          ProcessExternalResources: false,
          MutationEvents: false,
          QuerySelector: false
        }
      })).createWindow();
      $ = require('jquery').create(window);
      definitions = [];
      $(".meaning").each(function(idx, item) {
        return definitions.push($(item).text());
      });
      msgText = definitions.length === 0 ? "No definition found." : msg.random(definitions);
      return msg.send(msgText);
    });
  });
};
