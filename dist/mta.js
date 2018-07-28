// Description:
//   See the status of NYC subways

// Dependencies:
//   "xml2js": "0.1.14"

// Configuration:
//   None

// Commands:
//   hubot mta me <train> - the status of a nyc subway line

// Author:
//   jgv
var mtaMe, xml2js;

xml2js = require('xml2js');

module.exports = function(robot) {
  return robot.respond(/mta\s*(?:me)?\s*(\w+)?/i, function(msg) {
    return mtaMe(msg);
  });
};

mtaMe = function(msg) {
  return msg.http('http://web.mta.info/status/serviceStatus.txt').get()(function(err, res, body) {
    var parser;
    if (err) {
      throw err;
    }
    parser = new xml2js.Parser({
      'explicitRoot': 'service',
      'normalize': 'false'
    });
    return parser.parseString(body, function(err, res) {
      var i, j, k, len, re, ref, results, str;
      if (err) {
        throw err;
      }
      re = new RegExp(msg.match[1], 'gi');
      if (msg.match[1].length === 1 || msg.match[1].toUpperCase() === 'SIR') {
        ref = res.service.subway;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          j = ref[i];
          results.push((function() {
            var l, len1, ref1, results1;
            ref1 = j.line;
            results1 = [];
            for (l = 0, len1 = ref1.length; l < len1; l++) {
              k = ref1[l];
              if (k.name.length > 0) {
                str = k.name[0];
                if (str.match(re)) {
                  switch (k.status) {
                    case "GOOD SERVICE":
                      results1.push(msg.send(`the ${str} train is ok!`));
                      break;
                    case "PLANNED WORK":
                      results1.push(msg.send(`heads up, the ${str} train has planned work (updated ${k.Time})`));
                      break;
                    case "SERVICE CHANGE":
                      results1.push(msg.send(`the ${str} train has service changes (updated ${k.Time})`));
                      break;
                    case "DELAYS":
                      results1.push(msg.send(`the ${str} train is delayed (updated ${k.Time})`));
                      break;
                    default:
                      results1.push(msg.send(`the ${str} train status is ${k.status}`));
                  }
                } else {
                  results1.push(void 0);
                }
              } else {
                results1.push(void 0);
              }
            }
            return results1;
          })());
        }
        return results;
      } else {
        return msg.send("that's not a valid subway line!");
      }
    });
  });
};
