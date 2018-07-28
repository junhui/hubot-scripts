// Description:
//   Hubot, you complete me

// Dependencies:
//   "xml2js": "0.1.14"

// Configuration:
//   None

// Commands:
//   hubot complete me - Google Suggest a phrase

// Author:
//   aroben
var XMLJS, shuffle;

XMLJS = require("xml2js");

module.exports = function(robot) {
  return robot.respond(/complete( me)?(?: x(\d+))? (.*)$/i, function(msg) {
    var number, phrase;
    number = parseInt(msg.match[2], 10) || 1;
    phrase = msg.match[3];
    return msg.http('http://google.com/complete/search').query({
      q: phrase,
      output: 'toolbar'
    }).get()(function(err, res, body) {
      var parser;
      parser = new XMLJS.Parser({
        explicitArray: true
      });
      return parser.parseString(body, function(err, result) {
        var k, len, results, suggestions, x;
        if (!result.CompleteSuggestion) {
          msg.send(`No meatbag has ever searched for "${phrase}"`);
          return;
        }
        suggestions = (function() {
          var k, len, ref, results;
          ref = shuffle(result.CompleteSuggestion).slice(0, +(number - 1) + 1 || 9e9);
          results = [];
          for (k = 0, len = ref.length; k < len; k++) {
            x = ref[k];
            results.push(x.suggestion[0]['@'].data);
          }
          return results;
        })();
        results = [];
        for (k = 0, len = suggestions.length; k < len; k++) {
          x = suggestions[k];
          results.push(msg.send(x));
        }
        return results;
      });
    });
  });
};

shuffle = function(array) {
  var i, j;
  if (array.length > 0) {
    i = array.length;
    while (--i !== 0) {
      j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  return array;
};
