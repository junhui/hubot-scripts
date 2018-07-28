// THIS SCRIPT HAS MOVED TO ITS OWN PACKAGE. PLEASE USE
// https://github.com/hubot-scripts/hubot-tell INSTEAD!

// Description:
//   Tell Hubot to send a user a message when present in the room

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot tell <username> <some message> - tell <username> <some message> next time they are present. Case-Insensitive prefix matching is employed when matching usernames, so "foo" also matches "Foo" and "foooo"

// Author:
//   christianchristensen, lorenzhs, xhochy
module.exports = function(robot) {
  var localstorage;
  localstorage = {};
  robot.respond(/tell ([\w.-]*):? (.*)/i, function(msg) {
    var datetime, room, tellmessage, username;
    datetime = new Date();
    username = msg.match[1];
    room = msg.message.user.room;
    tellmessage = msg.message.user.name + " @ " + datetime.toLocaleString() + " said: " + msg.match[2] + "\r\n";
    if (localstorage[room] == null) {
      localstorage[room] = {};
    }
    if (localstorage[room][username] != null) {
      localstorage[room][username] += tellmessage;
    } else {
      localstorage[room][username] = tellmessage;
    }
    msg.send(`Ok, I'll tell ${username} you said '${msg.match[2]}'.`);
  });
  
  // When a user enters, check if someone left them a message
  return robot.enter(function(msg) {
    var message, recipient, ref, room, tellmessage, username;
    username = msg.message.user.name;
    room = msg.message.user.room;
    if (localstorage[room] != null) {
      ref = localstorage[room];
      for (recipient in ref) {
        message = ref[recipient];
        // Check if the recipient matches username
        if (username.match(new RegExp("^" + recipient, "i"))) {
          tellmessage = username + ": " + localstorage[room][recipient];
          delete localstorage[room][recipient];
          msg.send(tellmessage);
        }
      }
    }
  });
};
