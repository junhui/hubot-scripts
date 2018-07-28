// Description:
//   Load scripts from the hubot scripts directory on the fly for testing purposes

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot script load <script> - Load a script
//   hubot script list [-l]     - List all availiable scripts (optional -l for list mode)
//   hubot script info <script> - Print script help

// Author:
//   unitio
var Fs, Path;

Path = require('path');

Fs = require('fs');

module.exports = function(robot) {
  var printHelp;
  // Private: Print help for a script
  printHelp = function(script, msg) {
    var path, tmpRobot;
    path = Path.resolve('node_modules', 'hubot-scripts', 'src', 'scripts');
    // Call parseHelp on tmpRobot with custom array push, so we can capture the
    // commands as they are added, there's no other way to access the populated
    // commands array.
    tmpRobot = {
      logger: {
        debug: function(debug_msg) {
          return null;
        }
      },
      documentation: {},
      commands: {
        push: function(command) {
          return msg.send(command);
        }
      }
    };
    return robot.parseHelp.call(tmpRobot, Path.join(path, `${script}.coffee`));
  };
  // Load a script
  robot.respond(/script load (.*)$/i, function(msg) {
    var script, scriptPath;
    script = msg.match[1];
    scriptPath = require.resolve(Path.resolve('node_modules', 'hubot-scripts', 'src', 'scripts', script));
    printHelp(script, msg);
    return robot.loadFile(Path.dirname(scriptPath), Path.basename(scriptPath));
  });
  // List all available scripts
  robot.respond(/script list\s?(-l)?/i, function(msg) {
    return Fs.readdir(Path.resolve('node_modules', 'hubot-scripts', 'src', 'scripts'), function(err, files) {
      var file, listMode, scripts;
      if (err) {
        msg.send('An error occurred');
      }
      listMode = msg.match[1] != null;
      scripts = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = files.length; i < len; i++) {
          file = files[i];
          results.push(Path.basename(file, '.coffee'));
        }
        return results;
      })();
      if (listMode) {
        return msg.send(scripts.join('\n'));
      } else {
        return msg.send(scripts.join(', '));
      }
    });
  });
  // Print script help
  return robot.respond(/script info (.*)/i, function(msg) {
    var script;
    script = msg.match[1];
    return printHelp(script, msg);
  });
};
