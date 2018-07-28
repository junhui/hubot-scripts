// Description:
//   Allow Hubot to show the image from a quickmeme link, as dragging
//   from their site is a pain.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   http://www.quickmeme.com/meme/* - Detects the url and displays the image

// Author:
//   chrisdrackett
module.exports = function(robot) {
  return robot.hear(/https?:\/\/www\.quickmeme\.com\/\w+\/(\w+)\//i, function(msg) {
    var id;
    if (msg.match[2]) {
      return;
    }
    id = msg.match[1];
    return msg.send("http://i.qkme.me/" + id + ".jpg");
  });
};
