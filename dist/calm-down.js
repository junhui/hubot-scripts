// Description:
//   Calm down

// Configuration:
//   HUBOT_LESS_MANATEES

// Commands:
//   hubot calm me | manatee me - Reply with Manatee
//   calm down | simmer down | that escalated quickly - Reply with Manatee
//   ALL CAPS | LONGCAPS - Reply with Manatee
module.exports = function(robot) {
  var manatee;
  manatee = function() {
    var num;
    num = Math.floor(Math.random() * 30) + 1;
    return `http://calmingmanatee.com/img/manatee${num}.jpg`;
  };
  robot.respond(/manatee|calm( me)?/i, function(msg) {
    return msg.send(manatee());
  });
  robot.hear(/calm down|simmer down|that escalated quickly/i, function(msg) {
    return msg.send(manatee());
  });
  if (!process.env.HUBOT_LESS_MANATEES) {
    return robot.hear(/(\b([A-Z]{2,}\s+)([A-Z]{2,})\b)|(\b[A-Z]{5,}\b)/, function(msg) {
      return msg.send(manatee());
    });
  }
};
