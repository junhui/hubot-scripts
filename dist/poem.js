// Description
//   Tell a poem from the collective yearning of humanity, based on their Google searches.
//   Inspired by http://www.googlepoetics.com/

// Dependencies:
//   "jsdom": "0.8.4"

// Configuration:
//   None

// Commands:
//   hubot poem <about>              - Tell us a poem that starts like this
//   hubot poem <# of lines> <about> - Tell a poem in this many lines

// Notes:

// Author:
//   roblingle
var getSuggestions, jsdom;

jsdom = require('jsdom');

module.exports = function(robot) {
  return robot.respond(/poem(ify)?( (\d))? (.*)/i, function(msg) {
    var about, lines;
    lines = msg.match[3] || 3;
    about = msg.match[4];
    return getSuggestions(msg, about, function(suggestions, err) {
      return msg.send(err || suggestions.slice(0, lines).join('\n'));
    });
  });
};

getSuggestions = function(msg, term, cb) {
  return msg.http("https://clients1.google.com/complete/search").query({
    output: "toolbar",
    hl: "en",
    q: term
  }).get()(function(err, res, body) {
    var error, i, len, ref, suggestion, suggestions;
    try {
      suggestions = [];
      ref = jsdom.jsdom(body).getElementsByTagName('suggestion');
      for (i = 0, len = ref.length; i < len; i++) {
        suggestion = ref[i];
        suggestion = suggestion.getAttribute('data');
        if (!suggestion.match(/lyrics/)) {
          suggestions.push(suggestion);
        }
      }
    } catch (error1) {
      error = error1;
      err = "I don't feel like writing poems today";
    }
    return cb(suggestions, err);
  });
};
