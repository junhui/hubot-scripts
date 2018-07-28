// Thanking user by giving +1

// <receiver>: +1 for <reason> - give +1 to <receiver> (full name) because he did <reason>
// who thanks me - show how many people thank me and why
// (show ranking|ranking) - show top players
module.exports = function(robot) {
  var base;
  (base = robot.brain.data).achievements || (base.achievements = {});
  robot.hear(/(.*): *(\+1|thx) for (.*)$/i, function(msg) {
    var base1, event, reason, receiver, thanking;
    receiver = msg.match[1].trim();
    thanking = msg.message.user.name;
    reason = msg.match[3];
    if (receiver === thanking) {
      msg.send("hey, don't cheat!");
    }
    if (reason == null) {
      msg.send(`${thanking}: you must give a reason`);
    }
    if (receiver !== thanking && (reason != null)) {
      (base1 = robot.brain.data.achievements)[receiver] || (base1[receiver] = []);
      event = {
        reason: reason,
        given_by: thanking
      };
      robot.brain.data.achievements[receiver].push(event);
      return msg.send(`${event.given_by} say thanks to ${receiver} for ${event.reason}`);
    }
  });
  robot.respond(/who thanks me??/i, function(msg) {
    var achievement, i, len, ref, response, user;
    user = msg.message.user.name;
    response = `${user}, ${robot.brain.data.achievements[user].length} time(s) someone thanked you:\n`;
    ref = robot.brain.data.achievements[user];
    for (i = 0, len = ref.length; i < len; i++) {
      achievement = ref[i];
      response += `${achievement.given_by} for ${achievement.reason}\n`;
    }
    return msg.send(response);
  });
  return robot.respond(/(|show )ranking/i, function(msg) {
    var achievements, i, len, message, person, position, ranking, ref, sortedRanking, user;
    ranking = [];
    ref = robot.brain.data.achievements;
    for (person in ref) {
      achievements = ref[person];
      ranking.push({
        name: person,
        points: achievements.length
      });
    }
    sortedRanking = ranking.sort(function(a, b) {
      return b.points - a.points;
    });
    message = "Ranking\n";
    position = 0;
    for (i = 0, len = sortedRanking.length; i < len; i++) {
      user = sortedRanking[i];
      position += 1;
      message += `${position}. ${user.name} - ${user.points}\n`;
    }
    return msg.send(message);
  });
};
