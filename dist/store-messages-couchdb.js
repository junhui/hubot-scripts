// Description:
//   None

// Dependencies:
//   "cradle": "0.6.3"

// Configuration:
//   HUBOT_COUCHDB_URL

// Commands:
//   None

// Author:
//   Vrtak-CZ
var Url, cradle;

Url = require("url");

cradle = require("cradle");

// sets up hooks to persist all messages into couchdb.
module.exports = function(robot) {
  var auth, client, db, info;
  info = Url.parse(process.env.HUBOT_COUCHDB_URL || 'http://localhost:5984');
  if (info.auth) {
    auth = info.auth.split(":");
    client = new cradle.Connection(info.hostname, info.port, {
      auth: {
        username: auth[0],
        password: auth[1]
      }
    });
  } else {
    client = new cradle.Connection(info.hostname, info.port);
  }
  db = client.database(info.pathname !== '/' ? info.pathname.slice(1) : "hubot-storage");
  return robot.hear(/.*$/i, function(msg) {
    var message;
    message = msg.message;
    message.date = new Date;
    // ignore topic and other messages
    if (typeof message.user.id === 'undefined') {
      return;
    }
    return db.save(message, function(err, res) {
      if (err) {
        return console.error(err);
      }
    });
  });
};
