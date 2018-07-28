// Description:
//   Happiness in image form

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   me gusta - Display "Me Gusta" face when heard

// Author:
//   phyreman
module.exports = function(robot) {
  return robot.hear(/me gusta/i, function(msg) {
    return msg.send("http://s3.amazonaws.com/kym-assets/entries/icons/original/000/002/252/me-gusta.jpg");
  });
};
