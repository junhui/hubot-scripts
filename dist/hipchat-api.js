// Description:
//   Send messages using the Hipchat API (which allows you to choose colors
//   and send html messages) instead of the plain old jabber interface

// Dependencies:
//   "querystring": "0.1.0"

// Configuration:
//   HUBOT_HIPCHAT_TOKEN - Hipchat API token

// Commands:
//   None

// URLs:
//   GET /hubot/hipchat?room_id=<room_id>&message=<message>&from=<from>[&color=<red/yellow/green/gray/purple/random>&notify=<true/false>&message_format=<html/text>]

// Author:
//   mcdavis
var querystring;

querystring = require('querystring');

module.exports = function(robot) {
  return robot.router.get("/hubot/hipchat", function(req, res) {
    var callback, data, hipchat, https, params, path, query;
    https = require('https');
    query = querystring.parse(req._parsedUrl.query);
    hipchat = {};
    hipchat.format = 'json';
    hipchat.auth_token = process.env.HUBOT_HIPCHAT_TOKEN;
    if (query.room_id) {
      hipchat.room_id = query.room_id;
    }
    if (query.message) {
      hipchat.message = query.message;
    }
    if (query.from) {
      hipchat.from = query.from;
    }
    if (query.color) {
      hipchat.color = query.color;
    }
    if (query.notify) {
      hipchat.notify = query.notify;
    }
    if (query.message_format) {
      hipchat.message_format = query.message_format;
    }
    params = querystring.stringify(hipchat);
    path = `/v1/rooms/message/?${params}`;
    data = '';
    callback = function() {
      return res.end(data);
    };
    return https.get({
      host: 'api.hipchat.com',
      path: path
    }, function(res) {
      res.on('data', function(chunk) {
        return data += chunk.toString();
      });
      return res.on('end', function() {
        var json;
        json = JSON.parse(data);
        console.log("Hipchat response ", data);
        return callback();
      });
    });
  });
};
