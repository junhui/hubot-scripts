// Description:
//   A command that shows us a photo of the current line at Shake Shack

// Commands:
//   hubot shake cam - Returns an image of the line at Shake Shack

// Author:
//   desmondmorris
module.exports = function(robot) {
  return robot.respond(/shake cam/i, function(msg) {
    return msg.send('http://www.shakeshack.com/camera.jpg');
  });
};
