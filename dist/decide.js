// Description:
//   Allows Hubot to help you decide between multiple options

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot decide "<option 1>" "<option 2>" "<option x>" - Randomly picks an option
//   hubot decide <option1> <option2> <option3> - Randomly picks an option

// Author:
//   logikal
//   streeter
module.exports = function(robot) {
  robot.respond(/decide "(.*)"/i, function(msg) {
    var options;
    options = msg.match[1].split('" "');
    return msg.reply(`Definitely "${msg.random(options)}".`);
  });
  return robot.respond(/decide ([^"]+)/i, function(msg) {
    var options;
    options = msg.match[1].split(' ');
    return msg.reply(`Definitely "${msg.random(options)}".`);
  });
};
