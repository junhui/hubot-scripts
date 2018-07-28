// Description:
//   Allows Hubot to roll dice

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot roll (die|one) - Roll one six-sided dice
//   hubot roll dice - Roll two six-sided dice
//   hubot roll <x>d<y> - roll x dice, each of which has y sides

// Author:
//   ab9
var report, roll, rollOne;

module.exports = function(robot) {
  robot.respond(/roll (die|one)/i, function(msg) {
    return msg.reply(report([rollOne(6)]));
  });
  robot.respond(/roll dice/i, function(msg) {
    return msg.reply(report(roll(2, 6)));
  });
  return robot.respond(/roll (\d+)d(\d+)/i, function(msg) {
    var answer, dice, sides;
    dice = parseInt(msg.match[1]);
    sides = parseInt(msg.match[2]);
    answer = sides < 1 ? "I don't know how to roll a zero-sided die." : dice > 100 ? "I'm not going to roll more than 100 dice for you." : report(roll(dice, sides));
    return msg.reply(answer);
  });
};

report = function(results) {
  var finalComma, last, total;
  if (results != null) {
    switch (results.length) {
      case 0:
        return "I didn't roll any dice.";
      case 1:
        return `I rolled a ${results[0]}.`;
      default:
        total = results.reduce(function(x, y) {
          return x + y;
        });
        finalComma = (results.length > 2) ? "," : "";
        last = results.pop();
        return `I rolled ${results.join(", ")}${finalComma} and ${last}, making ${total}.`;
    }
  }
};

roll = function(dice, sides) {
  var i, j, ref, results1;
  results1 = [];
  for (i = j = 0, ref = dice; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
    results1.push(rollOne(sides));
  }
  return results1;
};

rollOne = function(sides) {
  return 1 + Math.floor(Math.random() * sides);
};
