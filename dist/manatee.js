// Description:
//   Allows Hubot to pull down images from calmingmanatee.com

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot manatee - outputs a random manatee

// Author:
//   Danny Lockard
module.exports = function(robot) {
  return robot.respond(/manatee/i, function(msg) {
    return msg.http('http://calmingmanatee.com').headers({
      'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1092.0 Safari/536.6'
    }).get()(function(err, res, body) {
      var manatee_no, url;
      if (err) {
        msg.send(`Something went wrong ${err}`);
        return;
      }
      url = res.headers.location;
      manatee_no = url.substring(url.lastIndexOf("/") + 1);
      return msg.send(`http://calmingmanatee.com/img/manatee${manatee_no}.jpg`);
    });
  });
};
