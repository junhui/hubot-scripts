// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot !! - Repeat the last command directed at hubot

// Author:
//   None
var store;

module.exports = function(robot) {
  robot.respond(/(.+)/i, function(msg) {
    return store(msg);
  });
  return robot.respond(/!!$/i, function(msg) {
    if (exports.last_command != null) {
      msg.send(exports.last_command);
      msg['message']['text'] = `${robot.name}: ${exports.last_command}`;
      robot.receive(msg['message']);
      return msg['message']['done'] = true;
    } else {
      return msg.send("i don't remember hearing anything.");
    }
  });
};

store = function(msg) {
  var command;
  command = msg.match[1].trim();
  if (command !== '!!') {
    return exports.last_command = command;
  }
};
