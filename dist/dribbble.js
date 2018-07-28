// Description:
//   Loads images from Dribbble URL's

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot (depress|dribbble|inspire) me - brings up popular images
//   [dribbble URL] - brings up image from the URL

// Author:
//   mattgraham
var requestImage;

requestImage = function(msg, url) {
  return msg.http(url).get()(function(err, res, body) {
    var data;
    if (res.statusCode === 302 && res.headers.location) {
      return requestImage(msg, res.headers.location);
    } else {
      data = JSON.parse(body);
      msg.send(data.image_url);
      return msg.send('"' + data.title + '"' + " by " + data.player.name);
    }
  });
};

module.exports = function(robot) {
  robot.respond(/(?:depress|dribbble|inspire)(?: me)?(.*)/i, function(msg) {
    var query;
    query = msg.match[1] || 'popular';
    query = query.trim();
    return msg.http(`http://api.dribbble.com/shots/${query}`).get()(function(err, res, body) {
      var data, i, idx, j, results;
      data = JSON.parse(body);
      idx = Math.floor(Math.random() * (data.shots.length - 2));
      results = [];
      for (i = j = 0; j <= 2; i = ++j) {
        results.push(msg.send(data.shots[idx + i].image_url));
      }
      return results;
    });
  });
  return robot.hear(/^https?:\/\/((www\.)?dribbble\.com\/shots\/?([0-9]+))|(drbl\.in\/([a-zA-Z0-9]+))/, function(msg) {
    var query;
    query = msg.match[3] || msg.match[5];
    return requestImage(msg, `http://api.dribbble.com/shots/${query}`);
  });
};
