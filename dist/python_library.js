// Description:
//   Allows hubot to get the link to a Python 2 or 3 libaray.

// Dependencies:
//   None

// Commands:
//   hubot python(2|3) library <name> - Gets the url of the named library if it exists.

// Author:
//   Bryce Verdier (btv)
var libraryMe;

module.exports = function(robot) {
  return robot.respond(/python(2|3) library (.*)/i, function(msg) {
    var matches;
    matches = msg.match;
    return libraryMe(robot, matches[1], matches[2], function(text) {
      return msg.send(text);
    });
  });
};

libraryMe = function(robot, version, lib, callback) {
  var url;
  url = `http://docs.python.org/${version}/library/${lib}.html`;
  return robot.http(url).get()(function(err, res, body) {
    if (res.statusCode !== 200) {
      return callback(`MERP! The library ${lib} does not exist!`);
    } else {
      return callback(url);
    }
  });
};
