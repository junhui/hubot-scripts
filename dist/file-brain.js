// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   FILE_BRAIN_PATH

// Commands:
//   None

// Author:
//   dustyburwell
var fs, path;

fs = require('fs');

path = require('path');

module.exports = function(robot) {
  var brainPath, data, error;
  brainPath = process.env.FILE_BRAIN_PATH || '/var/hubot';
  brainPath = path.join(brainPath, 'brain-dump.json');
  try {
    data = fs.readFileSync(brainPath, 'utf-8');
    if (data) {
      robot.brain.mergeData(JSON.parse(data));
    }
  } catch (error1) {
    error = error1;
    if (error.code !== 'ENOENT') {
      console.log('Unable to read file', error);
    }
  }
  return robot.brain.on('save', function(data) {
    return fs.writeFileSync(brainPath, JSON.stringify(data), 'utf-8');
  });
};
