// Description:
//   Emphasize a joke

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   rimshot - Link to a short video of a rimshot

// Author:
//   mrtazz
var shots;

shots = ['http://www.youtube.com/watch?v=6zXDo4dL7SU', 'http://www.youtube.com/watch?v=GnOl4VcV5ng', 'http://www.youtube.com/watch?v=3gPV2wzNNyo'];

module.exports = function(robot) {
  return robot.hear(/rimshot/i, function(msg) {
    return msg.send(msg.random(shots));
  });
};
