// Description:
//   URL encoding and decoding

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot url encode|decode <query> - URL encode or decode <string>
//   hubot url form encode|decode <query> - URL form-data encode or decode <string>

// Author:
//   jimeh
var urlFormDecode, urlFormEncode;

module.exports = function(robot) {
  robot.respond(/URL encode( me)? (.*)/i, function(msg) {
    return msg.send(encodeURIComponent(msg.match[2]));
  });
  robot.respond(/URL decode( me)? (.*)/i, function(msg) {
    return msg.send(decodeURIComponent(msg.match[2]));
  });
  robot.respond(/URL form encode( me)? (.*)/i, function(msg) {
    return msg.send(urlFormEncode(msg.match[2]));
  });
  return robot.respond(/URL form decode( me)? (.*)/i, function(msg) {
    return msg.send(urlFormDecode(msg.match[2]));
  });
};

// url form-data encoding helpers (partially ripped from jshashes npm package)
urlFormEncode = function(str) {
  return escape(str).replace(new RegExp('\\+', 'g'), '%2B').replace(new RegExp('%20', 'g'), '+');
};

urlFormDecode = function(str) {
  return unescape(str.replace(new RegExp('\\+', 'g'), ' '));
};
