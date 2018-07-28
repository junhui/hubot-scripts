// Description:
//   Clearly illustrate with an image what people mean whenever they say "facepalm"

// Dependencies:
//   None

// Configuration:
//   None

// Commands:

// Author:
//   jimeh
var facepalmMe, imageMe;

module.exports = function(robot) {
  return robot.hear(/facepalm/i, function(msg) {
    // Randomly use facepalm.org or a Google Image search for "facepalm".
    if (msg.random([0, 1])) {
      return facepalmMe(msg, function(url) {
        return msg.send(url);
      });
    } else {
      return imageMe(msg, "facepalm", function(url) {
        return msg.send(url);
      });
    }
  });
};

facepalmMe = function(msg, cb) {
  return msg.http('http://facepalm.org/img.php').get()(function(err, res, body) {
    return cb(`http://facepalm.org/${res.headers['location']}#.png`);
  });
};

imageMe = function(msg, query, cb) {
  return msg.http('http://ajax.googleapis.com/ajax/services/search/images').query({
    v: "1.0",
    rsz: '8',
    q: query,
    safe: 'active'
  }).get()(function(err, res, body) {
    var image, images;
    images = JSON.parse(body);
    images = images.responseData.results;
    if (images.length > 0) {
      image = msg.random(images);
      return cb(`${image.unescapedUrl}#.png`);
    }
  });
};
