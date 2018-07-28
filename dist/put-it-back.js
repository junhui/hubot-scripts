// Description:
//   put back the table

// Dependencies:
//   None

// Configuration:
//   None

// Commands:

// Author:
//   ajacksified
module.exports = function(robot) {
  return robot.hear(/（╯°□°）╯︵ ┻━┻/i, function(msg) {
    return msg.send('┬──┬ ノ( ゜-゜ノ)');
  });
};
