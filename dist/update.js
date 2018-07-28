// Description:
//   Allows hubot to update itself using git pull and npm update.
//   If updates are downloaded you'll need to restart hubot, for example using "hubot die" (restart using a watcher like forever.js).

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot update - Performs a git pull and npm udate.
//   hubot pending update - Informs if there are pending updates (hubot needs a restart)

// Author:
//   benjamine
var child_process, downloaded_updates;

child_process = require('child_process');

downloaded_updates = false;

module.exports = function(robot) {
  robot.respond(/pending updates?\??$/i, function(msg) {
    if (downloaded_updates) {
      return msg.send("I have some pending updates, KILL ME PLEASE! (hint: hubot die)");
    } else {
      return msg.send("I'm up-to-date!");
    }
  });
  return robot.respond(/update( yourself)?$/i, function(msg) {
    var changes, error;
    changes = false;
    try {
      msg.send("git pull...");
      return child_process.exec('git pull', function(error, stdout, stderr) {
        var output;
        if (error) {
          msg.send("git pull failed: " + stderr);
        } else {
          output = stdout + '';
          if (!/Already up\-to\-date/.test(output)) {
            msg.send("my source code changed:\n" + output);
            changes = true;
          } else {
            msg.send("my source code is up-to-date");
          }
        }
        try {
          msg.send("npm update...");
          return child_process.exec('npm update', function(error, stdout, stderr) {
            if (error) {
              msg.send("npm update failed: " + stderr);
            } else {
              output = stdout + '';
              if (/node_modules/.test(output)) {
                msg.send("some dependencies updated:\n" + output);
                changes = true;
              } else {
                msg.send("all dependencies are up-to-date");
              }
            }
            if (changes) {
              downloaded_updates = true;
              return msg.send("I downloaded some updates, KILL ME PLEASE! (hint: hubot die)");
            } else {
              if (downloaded_updates) {
                return msg.send("I have some pending updates, KILL ME PLEASE! (hint: hubot die)");
              } else {
                return msg.send("I'm up-to-date!");
              }
            }
          });
        } catch (error1) {
          error = error1;
          return msg.send("npm update failed: " + error);
        }
      });
    } catch (error1) {
      error = error1;
      return msg.send("git pull failed: " + error);
    }
  });
};
