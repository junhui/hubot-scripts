// Description:
//   Show random octocat

// Dependencies:
//   "xml2js": "0.1.14"

// Configuration:
//   None

// Commands:
//   hubot octocat me - a randomly selected octocat
//   hubot octocat bomb me <number> - octocat-splosion!

// Author:
//   joshuaflanagan
var show_octocats, xml2js;

xml2js = require('xml2js');

module.exports = function(robot) {
  robot.respond(/octocat\s*(?:me)?$/i, function(msg) {
    return show_octocats(msg, 1);
  });
  return robot.respond(/octocat\s+(?:bomb)\s*(?:me)?\s*(\d+)?/i, function(msg) {
    var count;
    count = msg.match[1] || 5;
    return show_octocats(msg, count);
  });
};

show_octocats = function(msg, count) {
  return msg.http('http://feeds.feedburner.com/Octocats').query({
    format: 'xml'
  }).get()(function(err, res, body) {
    var parser;
    parser = new xml2js.Parser();
    return parser.parseString(body, function(err, result) {
      var i, j, octocats, r, ref, results;
      octocats = (function() {
        var j, len, ref, results;
        ref = result["entry"];
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          r = ref[j];
          results.push(r["content"]["div"]["a"]["img"]["@"]["src"]);
        }
        return results;
      })();
      results = [];
      for (i = j = 1, ref = count; (1 <= ref ? j <= ref : j >= ref); i = 1 <= ref ? ++j : --j) {
        results.push(msg.send(msg.random(octocats)));
      }
      return results;
    });
  });
};
