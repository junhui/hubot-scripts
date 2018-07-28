// Description:
//   Returns a command from commandlinefu.com

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot commandlinefu me - returns random command
//   hubot commandlinefu me <command> - random entry for the comand passed

// Author:
//   aaronott
var command;

module.exports = function(robot) {
  return robot.respond(/commandlinefu(?: me)? *(.*)?/i, function(msg) {
    var query;
    query = msg.match[1] ? `matching/${msg.match[1]}/${new Buffer(msg.match[1]).toString('base64')}/json` : "random/json";
    return command(msg, `http://www.commandlinefu.com/commands/${query}`, function(cmd) {
      return msg.send(cmd);
    });
  });
};

command = function(msg, uri, cb) {
  return msg.http(uri).get()(function(err, res, body) {
    var cc;
    // The random call passes back a 302 to redirect to a new page, if this
    // happens we redirect through a recursive function call passing the new
    // location to retrieve
    if (res.statusCode === 302) {
      return command(msg, res.headers.location, cb);
    } else {
      // choose a random command from the returned list
      cc = msg.random(JSON.parse(body));
      return cb(`-- ${cc.summary}\n${cc.command}`);
    }
  });
};
