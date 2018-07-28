// Description:
//   Automatically add mustaches to any images it can

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   None

// Author:
//   atmos
module.exports = function(robot) {
  return robot.hear(/^(https?:\/\/[^ #]+\.(?:png|jpg|jpeg))(?:[#]\.png)?$/i, function(msg) {
    var src;
    src = msg.match[1];
    if (!src.match(/^http:\/\/mustachify.me/)) {
      return msg.http("http://stacheable.herokuapp.com").query({
        src: src
      }).get()(function(err, res, body) {
        var img;
        img = JSON.parse(body);
        if (img.count > 0) {
          return msg.send(`http://mustachify.me/?src=${escape(img.src)}`);
        }
      });
    }
  });
};
