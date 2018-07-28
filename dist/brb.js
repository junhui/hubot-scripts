// Description:
//   Natural availability tracking.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   brb (or afk, or bbl)

// Author:
//   jmhobbs
module.exports = function(robot) {
  var users_away;
  users_away = {};
  robot.hear(/./i, function(msg) {
    var results, state, substr, user;
    if (users_away[msg.message.user.name] && msg.message.text !== 'brb') {
      msg.send("Welcome back " + msg.message.user.name + "!");
      return delete users_away[msg.message.user.name];
    } else {
      results = [];
      for (user in users_away) {
        state = users_away[user];
        substr = msg.message.text.substring(0, user.length + 1);
        if (substr.toLowerCase() === user.toLowerCase() + ':') {
          msg.send(user + " is currently away.");
          break;
        } else {
          results.push(void 0);
        }
      }
      return results;
    }
  });
  return robot.hear(/\b(brb|afk|bbl|bbiab|bbiaf)\b/i, function(msg) {
    return users_away[msg.message.user.name] = true;
  });
};
