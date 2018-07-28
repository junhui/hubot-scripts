  // Description:
  //   Take notes on scrum daily meetings

  // Dependencies:
  //   None

  // Configuration:
  //   HUBOT_SCRUMNOTES_PATH - if set, folder where daily notes should be saved as json files (otherwise they just stay on robot brain)

  // Commands:
  //   hubot take scrum notes - Starts taking notes from all users in the room (records all messages starting with yesterday, today, tomorrow, sun, mon, tue, wed, thu, fri, sat, blocking)
  //   hubot stop taking notes - Stops taking scrum notes (if a path is configured saves day notes to a json file)
  //   hubot scrum notes - shows scrum notes taken so far
  //   hubot are you taking notes? - hubot indicates if he's currently taking notes

  // Author:
  //   benjamin eidelman
var env, fs,
  indexOf = [].indexOf,
  hasProp = {}.hasOwnProperty;

env = process.env;

fs = require('fs');

module.exports = function(robot) {
  var getDate, hearingRooms, listener, messageKeys, mkdir, startHearing, stopHearing;
  
  // rooms where hubot is hearing for notes
  hearingRooms = {};
  messageKeys = ['blocking', 'blocker', 'yesterday', 'today', 'tomorrow', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
  getDate = function() {
    var dd, mm, today, yyyy;
    today = new Date();
    dd = today.getDate();
    mm = today.getMonth() + 1;
    yyyy = today.getFullYear();
    if (dd < 10) {
      dd = '0' + dd;
    }
    if (mm < 10) {
      mm = '0' + mm;
    }
    return yyyy + '-' + mm + '-' + dd;
  };
  listener = null;
  startHearing = function() {
    var listenersCount;
    if (listener) {
      return;
    }
    listenersCount = robot.catchAll(function(msg) {
      var base, base1, base2, key, keyValue, name, notes, today;
      if (!hearingRooms[msg.message.user.room]) {
        return;
      }
      today = getDate();
      name = msg.message.user.name;
      if ((base = robot.brain.data).scrumNotes == null) {
        base.scrumNotes = {};
      }
      notes = (base1 = robot.brain.data.scrumNotes)[today] != null ? base1[today] : base1[today] = {};
      if (notes._raw == null) {
        notes._raw = [];
      }
      notes._raw.push([new Date().getTime(), name, msg.message.text]);
      keyValue = /^([^ :\n\r\t]+)[ :\n\t](.+)$/m.exec(msg.message.text);
      if (keyValue) {
        if (notes[name] == null) {
          notes[name] = {};
        }
        key = keyValue[1].toLowerCase();
        if ((indexOf.call(messageKeys, key) >= 0)) {
          if ((base2 = notes[name])[key] == null) {
            base2[key] = [];
          }
          return notes[name][key].push(keyValue[2]);
        }
      }
    });
    return listener = robot.listeners[listenersCount - 1];
  };
  stopHearing = function() {
    var i, j, len, list, listenerIndex, ref;
    if (!listener) {
      return;
    }
    listenerIndex = -1;
    ref = robot.listeners;
    for (i = j = 0, len = ref.length; j < len; i = ++j) {
      list = ref[i];
      if (list === listener) {
        listenerIndex = i;
        break;
      }
    }
    if (listenerIndex >= 0) {
      setTimeout(function() {
        return robot.listeners.splice(i, 1);
      }, 0);
    }
    return listener = null;
  };
  mkdir = function(path, root) {
    var dir, dirs, e;
    dirs = path.split('/');
    dir = dirs.shift();
    root = (root || '') + dir + '/';
    try {
      fs.mkdirSync(root);
    } catch (error) {
      e = error;
      if (!fs.statSync(root).isDirectory()) {
        throw new Error(e);
      }
    }
    return !dirs.length || mkdir(dirs.join('/'), root);
  };
  robot.respond(/(?:show )?scrum notes/i, function(msg) {
    var j, key, len, notes, ref, response, today, user, userNotes;
    today = getDate();
    notes = (ref = robot.brain.data.scrumNotes) != null ? ref[today] : void 0;
    if (!notes) {
      return msg.reply('no notes so far');
    } else {
      // build a pretty version
      response = [];
      for (user in notes) {
        if (!hasProp.call(notes, user)) continue;
        userNotes = notes[user];
        if (user !== '_raw') {
          response.push(user, ':\n');
          for (j = 0, len = messageKeys.length; j < len; j++) {
            key = messageKeys[j];
            if (userNotes[key]) {
              response.push('  ', key, ': ', userNotes[key].join(', '), '\n');
            }
          }
        }
      }
      return msg.reply(response.join(''));
    }
  });
  robot.respond(/take scrum notes/i, function(msg) {
    startHearing();
    hearingRooms[msg.message.user.room] = true;
    return msg.reply('taking scrum notes, I hear you');
  });
  robot.respond(/are you taking (scrum )?notes\?/i, function(msg) {
    var takingNotes;
    takingNotes = !!hearingRooms[msg.message.user.room];
    return msg.reply(takingNotes ? 'Yes, I\'m taking scrum notes' : 'No, I\'m not taking scrum notes');
  });
  return robot.respond(/stop taking (?:scrum )?notes/i, function(msg) {
    var count, notes, ref, saveTo, status, today, user, users;
    delete hearingRooms[msg.message.user.room];
    msg.reply("not taking scrum notes anymore");
    today = getDate();
    notes = (ref = robot.brain.data.scrumNotes) != null ? ref[today] : void 0;
    users = (function() {
      var j, len, ref1, results;
      ref1 = Object.keys(notes);
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        user = ref1[j];
        if (user !== '_raw') {
          results.push(user);
        }
      }
      return results;
    })();
    count = notes ? users.length : 0;
    status = "I got no notes today";
    if (count > 0) {
      status = ["I got notes from ", users.slice(0, Math.min(3, users.length - 1)).join(', '), " and ", users.length > 3 ? (users.length - 3) + ' more' : users[users.length - 1]].join('');
    }
    msg.reply(status);
    if (Object.keys(hearingRooms).length < 1) {
      stopHearing();
    }
    saveTo = process.env.HUBOT_SCRUMNOTES_PATH;
    if (saveTo) {
      mkdir(saveTo + '/scrumnotes');
      fs.writeFileSync(saveTo + '/scrumnotes/' + today + '.json', JSON.stringify(notes, null, 2));
      return msg.send('scrum notes saved at: /scrumnotes/' + today + '.json');
    }
  });
};
