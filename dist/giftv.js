// Description:
//   Return random animated GIFs from giftv

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot giftv me - Returns a random animated GIF

// Author:
//   brettbuddin
module.exports = function(robot) {
  return robot.respond(/giftv( me)?$/i, function(msg) {
    return msg.http('http://www.gif.tv/gifs/get.php').get()(function(err, res, body) {
      return msg.send('http://www.gif.tv/gifs/' + body + '.gif' || 'Could not compute.');
    });
  });
};
