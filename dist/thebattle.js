// Description:
//   Display "The Battle" image

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   knowing is half the battle - display "The Battle" image

// Author:
//   coyled
var thebattle;

thebattle = ["http://static2.nerduo.com/thebattle_zoom.png", "http://img.skitch.com/20090805-g4a2qhttwij8n2jr9t552efn3k.png"];

module.exports = function(robot) {
  return robot.hear(/knowing is half the battle/i, function(msg) {
    return msg.send(msg.random(thebattle));
  });
};
