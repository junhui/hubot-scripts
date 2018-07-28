// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   None

// Commands:

// Author:
//   harukizaemon
module.exports = function(robot) {
  robot.hear(/inconceivable/i, function(msg) {
    return msg.send("You keep using that word. I do not think it means what you think it means.");
  });
  return robot.hear(/(inigo|montoya)/i, function(msg) {
    return msg.send("Hello. My name is Inigo Montoya. You killed my father. Prepare to die.");
  });
};
