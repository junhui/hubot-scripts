// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   disassemble - NO DISASSEMBLE

// Author:
//   listrophy
module.exports = function(robot) {
  return robot.hear(/disassemble/i, function(msg) {
    return msg.send('NO DISASSEMBLE!');
  });
};
