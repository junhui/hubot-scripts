// Description:
//  Interact with Helpscout

// Configuration:
//   HUBOT_HELPSCOUT_API_KEY - Go to Your Profile -> API Keys

// Commands:
//   hubot hs mailboxes - list Helpscout mailboxes
//   hubot hs count MAILBOX_ID - Return the number of active tickets in a mailbox
//   hubot hs users MAILBOX_ID - List the number of active tickets each user has in a mailbox

// Author:
//   Brett Hardin (http://bretthard.in)
var Util, api_key, getRequest, url;

Util = require("util");

url = 'https://api.helpscout.net/v1';

api_key = process.env.HUBOT_HELPSCOUT_API_KEY;

getRequest = function(msg, path, callback) {
  var auth;
  auth = 'Basic ' + new Buffer(`${api_key}:x`).toString('base64');
  return msg.robot.http(`${url}${path}`).headers({
    "Authorization": auth,
    "Accept": "application/json"
  }).get()(function(err, res, body) {
    return callback(err, res, body);
  });
};

module.exports = function(robot) {
  // hubot helpscout users FOLDER_ID
  robot.respond(/hs users\s?(@\w+)?(.*)/i, function(msg) {
    var mailboxId;
    if (api_key) {
      mailboxId = msg.match[2];
      return getRequest(msg, `/mailboxes/${mailboxId}/conversations.json?status=active`, function(err, res, body) {
        var conversation, conversations, i, item, j, key, len, len1, ref, response, results, users, value;
        response = JSON.parse(body);
        users = [];
        conversations = [];
        ref = response.items;
        for (i = 0, len = ref.length; i < len; i++) {
          item = ref[i];
          if (item.owner !== null) {
            conversations.push({
              name: `${item.owner.firstName} ${item.owner.lastName}`,
              createdAt: item.createdAt
            });
          } else {
            conversations.push({
              name: 'Unassigned',
              createdAt: item.createdAt
            });
          }
        }
        for (j = 0, len1 = conversations.length; j < len1; j++) {
          conversation = conversations[j];
          for (key in conversation) {
            value = conversation[key];
            if (key === 'name' && !users[value]) {
              users[value] = 1;
            } else if (key === 'name') {
              users[value] += 1;
            }
          }
        }
        results = [];
        for (key in users) {
          value = users[key];
          results.push(msg.send(`${key}: ${value}`));
        }
        return results;
      });
    } else {
      return msg.send("Don't have the HUBOT_HELPSCOUT_API_KEY.");
    }
  });
  // hubot helpscout count FOLDER_ID
  robot.respond(/hs count\s?(@\w+)?(.*)/i, function(msg) {
    var mailboxId;
    if (api_key) {
      mailboxId = msg.match[2];
      return getRequest(msg, "/mailboxes/" + mailboxId + "/conversations.json?status=active", function(err, res, body) {
        var response;
        response = JSON.parse(body);
        return msg.send(response.count);
      });
    } else {
      return msg.send("Don't have the HUBOT_HELPSCOUT_API_KEY.");
    }
  });
  // hubot helpscout mailboxes  
  return robot.respond(/hs mailboxes\s?(.*)?/i, function(msg) {
    if (api_key) {
      return getRequest(msg, "/mailboxes.json", function(err, res, body) {
        var i, item, len, ref, response, results;
        response = JSON.parse(body);
        ref = response.items;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          item = ref[i];
          results.push(msg.send(`${item.id}: ${item.name}`));
        }
        return results;
      });
    } else {
      return msg.send("Don't have the HUBOT_HELPSCOUT_API_KEY.");
    }
  });
};
