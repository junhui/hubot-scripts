// Description:
//   Allows Hubot to give a look of disapproval

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot lod <name> - gives back the character for the look of disapproval, optionally @name

// Author:
//   ajacksified
module.exports = function(robot) {
  return robot.respond(/lod\s?(.*)/i, function(msg) {
    var name, response;
    response = 'ಠ_ಠ';
    name = msg.match[1].trim();
    if (name !== "") {
      response += " @" + name;
    }
    return msg.send(response);
  });
};
