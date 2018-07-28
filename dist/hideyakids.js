// Description:
//   Antoine Dodson's greatest hits... errr... only hit 

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hide ya kids - Hide `em!

// Author:
//   Joseph Huttner
module.exports = function(robot) {
  return robot.hear(/hide ya kids/i, function(msg) {
    return msg.send("http://www.youtube.com/watch?v=hMtZfW2z9dw");
  });
};
