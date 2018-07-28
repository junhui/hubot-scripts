// Description:
//   Polite.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:

// Author:
//   dannymcc
var farewellResponses, responses, shortResponses, youTalkinToMe;

responses = ["You're welcome.", "No problem.", "Anytime.", "That's what I'm here for!", "You are more than welcome.", "You don't have to thank me, I'm your loyal servant.", "Don't mention it."];

shortResponses = ['vw', 'np'];

farewellResponses = ['Goodbye', 'Have a good evening', 'Bye', 'Take care', 'Nice speaking with you', 'See you later'];

// http://en.wikipedia.org/wiki/You_talkin'_to_me%3F
youTalkinToMe = function(msg, robot) {
  var input, name;
  input = msg.message.text.toLowerCase();
  name = robot.name.toLowerCase();
  return input.match(new RegExp('\\b' + name + '\\b', 'i')) != null;
};

module.exports = function(robot) {
  robot.hear(/\b(thanks|thank you|cheers|nice one)\b/i, function(msg) {
    if (youTalkinToMe(msg, robot)) {
      return msg.reply(msg.random(responses));
    }
  });
  robot.hear(/\b(ty|thx)\b/i, function(msg) {
    if (youTalkinToMe(msg, robot)) {
      return msg.reply(msg.random(shortResponses));
    }
  });
  robot.hear(/\b(hello|hi|sup|howdy|good (morning|evening|afternoon))\b/i, function(msg) {
    if (youTalkinToMe(msg, robot)) {
      return msg.reply(`${robot.name} at your service!`);
    }
  });
  return robot.hear(/\b(bye|night|goodbye|good night)\b/i, function(msg) {
    if (youTalkinToMe(msg, robot)) {
      return msg.reply(msg.random(farewellResponses));
    }
  });
};
