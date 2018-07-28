// Description:
//   A hubot interface for Bang, a key-value store for text snippets

// Dependencies:
//   "bang": "1.0.1"
//   "shellwords": "0.0.1"

// Configuration:
//   None

// Commands:
//   hubot bang [--help|--list|--delete] <key> [value] - Store and retrieve text snippets

// Author:
//   jimmycuadra
var Bang, split;

Bang = require("bang");

({split} = require("shellwords"));

module.exports = function(robot) {
  return robot.respond(/bang\s+(.*)/i, function(msg) {
    var args, bang, base, error, key, list, result, value;
    try {
      args = split(msg.match[1]);
    } catch (error1) {
      error = error1;
      return msg.send("I couldn't Bang that cause your quotes didn't match.");
    }
    bang = new Bang;
    bang.data = (base = robot.brain.data).bang != null ? base.bang : base.bang = {};
    bang.save = function() {};
    [key, value] = args;
    if (key === "-h" || key === "--help") {
      return msg.send(`Bang stores text snippets in my brain.\nSet a key:    ${robot.name} bang foo bar\nGet a key:    ${robot.name} bang foo\nDelete a key: ${robot.name} bang [-d|--delete] foo\nList keys:    ${robot.name} bang [-l|--list]\nGet help:     ${robot.name} bang [-h|--help]`);
    } else if (key === "-l" || key === "--list") {
      list = bang.list();
      if (list) {
        return msg.send(list);
      } else {
        return msg.send("I couldn't find any Bang data in my brain.");
      }
    } else if ((key === "-d" || key === "--delete") && value) {
      bang.delete(value);
      return msg.send(`I stopped Banging ${value}.`);
    } else if (key && value) {
      bang.set(key, value);
      return msg.send(`I Banged ${value} into ${key}.`);
    } else if (key) {
      result = bang.get(key);
      if (result) {
        return msg.send(result);
      } else {
        return msg.send(`Nothing's been Banged into ${key}.`);
      }
    }
  });
};
