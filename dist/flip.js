// Description:
//   When things aren't going well, you must flip it. (╯°□°）╯︵ ʇoqnɥ

// Dependencies:
//   "flip": "~0.1.0"

// Commands:
//   hubot flip <text> - express your anger
//   hubot rage flip <text> - express your anger with rage
//   hubot unflip <text>

// Authors:
//   jergason
//   spajus
var flip;

flip = require('flip');

module.exports = function(robot) {
  robot.respond(/(rage )?flip( .*)?$/i, function(msg) {
    var flipped, guy, toFlip;
    if (msg.match[1] === 'rage ') {
      guy = '(ノಠ益ಠ)ノ彡';
    } else {
      guy = '(╯°□°）╯︵';
    }
    toFlip = (msg.match[2] || '').trim();
    if (toFlip === 'me') {
      toFlip = msg.message.user.name;
    }
    if (toFlip === '') {
      flipped = '┻━┻';
    } else {
      flipped = flip(toFlip);
    }
    return msg.send(`${guy} ${flipped}`);
  });
  return robot.respond(/unflip( .*)?$/i, function(msg) {
    var toUnflip, unflipped;
    toUnflip = (msg.match[1] || '').trim();
    if (toUnflip === 'me') {
      unflipped = msg.message.user.name;
    } else if (toUnflip === '') {
      unflipped = '┬──┬';
    } else {
      unflipped = toUnflip;
    }
    return msg.send(`${unflipped} ノ( º _ ºノ)`);
  });
};
