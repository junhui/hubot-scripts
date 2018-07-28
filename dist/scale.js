// Description
//   Simple axis visualization.

// Commands:
//   hubot scale <value> - Show a simple text scale.
//   hubot scale <locale> <value> - Show a simple text scale in specified locale - can be 'uk', 'nj', or 'uh'.

// Author:
//   pengwynn
//   ymendel
//   balevine
var drawScale;

drawScale = function(value, max = 10, locale = 'us') {
  var left, pos, right, textMax, textMin;
  if (value != null) {
    locale = locale.replace(' ', '').toLowerCase();
    max = parseInt(max);
    pos = value ? parseInt(value) : 0;
    if (pos == null) {
      pos = 0;
    }
    pos = Math.min(pos, max);
    pos = Math.max(pos, 0);
    switch (locale) {
      case 'uh':
        textMin = "wut";
        textMax = "wat";
        break;
      case 'uk':
        textMin = "dreadful";
        textMax = "brilliant";
        break;
      case 'nj':
        textMin = "You think you're better than me?";
        textMax = "fuggedaboutit";
        break;
      default:
        textMin = "horrible";
        textMax = "amazing";
    }
    left = Array(pos).join("=");
    right = Array(max - pos + 1).join("=");
    return `[${textMin}]${left}X${right}[${textMax}]`;
  }
};

module.exports = function(robot) {
  return robot.respond(/scale(\s\w+)? (\d+)\/?(\d+)?/i, function(msg) {
    return msg.send(drawScale(msg.match[2], msg.match[3], msg.match[1]));
  });
};
