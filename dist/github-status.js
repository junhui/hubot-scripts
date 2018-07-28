// Description:
//   Show current GitHub status and messages

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot github status - Returns the current system status and timestamp.
//   hubot github status last - Returns the last human communication, status, and timestamp.
//   hubot github status messages - Returns the most recent human communications with status and timestamp.

// Author:
//   voke
var formatString, lastMessage, status, statusMessages;

module.exports = function(robot) {
  robot.respond(/github status$/i, function(msg) {
    return status(msg);
  });
  robot.respond(/github status last$/i, function(msg) {
    return lastMessage(msg);
  });
  return robot.respond(/github status messages$/i, function(msg) {
    return statusMessages(msg);
  });
};

// NOTE: messages contains new lines for some reason.
formatString = function(string) {
  return decodeURIComponent(string.replace(/(\n)/gm, " "));
};

status = function(msg) {
  return msg.http('https://status.github.com/api/status.json').get()(function(err, res, body) {
    var date, json, now, secondsAgo;
    json = JSON.parse(body);
    now = new Date();
    date = new Date(json['last_updated']);
    secondsAgo = Math.round((now.getTime() - date.getTime()) / 1000);
    return msg.send(`Status: ${json['status']} (${secondsAgo} seconds ago)`);
  });
};

lastMessage = function(msg) {
  return msg.http('https://status.github.com/api/last-message.json').get()(function(err, res, body) {
    var date, json;
    json = JSON.parse(body);
    date = new Date(json['created_on']);
    return msg.send(`Status: ${json['status']}\n` + `Message: ${formatString(json['body'])}\n` + `Date: ${date.toLocaleString()}`);
  });
};

statusMessages = function(msg) {
  return msg.http('https://status.github.com/api/messages.json').get()(function(err, res, body) {
    var buildMessage, json, message;
    json = JSON.parse(body);
    buildMessage = function(message) {
      var date;
      date = new Date(message['created_on']);
      return `[${message['status']}] ${formatString(message['body'])} (${date.toLocaleString()})`;
    };
    return msg.send(((function() {
      var i, len, results;
      results = [];
      for (i = 0, len = json.length; i < len; i++) {
        message = json[i];
        results.push(buildMessage(message));
      }
      return results;
    })()).join('\n'));
  });
};
