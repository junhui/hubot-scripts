// Description:
//   Get a snow report from onthesnow.com

// Dependencies:
//   "xml2js": "0.1.14"

// Configuration:
//   None

// Commands:
//   hubot snow in <two letter state name> - Displays resort info for a state, .e.g., snow in CO
//   hubot snow at <resort>, <two letter state name> - Displays info for a single resort

// Author:
//   rwc9u
var get_snow_report, snow_report, states, xml2js;

xml2js = require('xml2js');

states = {
  'ak': 'alaska',
  'az': 'arizona',
  'ca': 'california',
  'co': 'colorado',
  'ct': 'connecticut',
  'id': 'idaho',
  'il': 'illinois',
  'in': 'indiana',
  'ia': 'iowa',
  'me': 'maine',
  'md': 'maryland',
  'ma': 'massachusetts',
  'mi': 'michigan',
  'mn': 'minnesota',
  'mo': 'missouri',
  'mt': 'montana',
  'nv': 'nevada',
  'nh': 'new-hampshire',
  'nj': 'new-jersey',
  'nm': 'new-mexico',
  'ny': 'new-york',
  'nc': 'north-carolina',
  'oh': 'ohio',
  'or': 'oregon',
  'pa': 'pennsylvania',
  'sd': 'south-dakota',
  'tn': 'tennessee',
  'ut': 'utah',
  'vt': 'vermont',
  'va': 'virginia',
  'wa': 'washington',
  'wv': 'west-virginia',
  'wi': 'wisconsin',
  'wy': 'wyoming'
};

module.exports = function(robot) {
  robot.respond(/snow in (\w+)$/i, function(msg) {
    return snow_report(msg, msg.match[1], null);
  });
  return robot.respond(/snow at (.+), (\w+)$/i, function(msg) {
    return snow_report(msg, msg.match[2], msg.match[1]);
  });
};

snow_report = function(msg, state, resort) {
  var state_full;
  state_full = states[state.toLowerCase()];
  if (!state_full) {
    msg.send(`Sorry bro, ${state} isn't a legit state or there are no resorts there!`);
    return;
  }
  return get_snow_report(msg, `http://www.onthesnow.com/${state_full}/snow-rss.html`, resort);
};

get_snow_report = function(msg, url, resort) {
  return msg.http(url).get()(function(err, res, body) {
    var parser;
    if (res.statusCode === 301) {
      return get_snow_report(msg, res.headers.location, resort);
    } else if (res.statusCode === 404) {
      return msg.send("Couldn't find that location.");
    } else {
      parser = new xml2js.Parser();
      return parser.parseString(body, function(err, result) {
        var area, i, len, output, ref;
        if (err) {
          msg.send(`Got: ${err}`);
        }
        output = "";
        ref = result.channel.item;
        for (i = 0, len = ref.length; i < len; i++) {
          area = ref[i];
          if ((resort != null) && resort.toLowerCase() === area.title.toLowerCase()) {
            output = `${area.title} - ${area.description}`;
          } else {
            if (resort == null) {
              output += `${area.title} - ${area.description}\n`;
            }
          }
        }
        return msg.send(output);
      });
    }
  });
};
