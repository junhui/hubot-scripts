// Description:
//   Overlay funny things on people's faces

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot hipster me <img> - Overlay hipster glasses on a face
//   hubot clown me <img> - Overlay a clown nose on a face
//   hubot scumbag me <img> - Overlay a scumbag on a face
//   hubot jason me <img> - Overlay a jason on a face

// Author:
//   kneath
var imageMe;

module.exports = function(robot) {
  return robot.respond(/(hipster|clown|scumbag|rohan|jason)( me)? (.*)/i, function(msg) {
    var imagery, type;
    type = msg.match[1];
    imagery = msg.match[3];
    if (imagery.match(/^https?:\/\//i)) {
      return msg.send(`http://faceup.me/img?overlay=${type}&src=${imagery}`);
    } else {
      return imageMe(msg, imagery, function(url) {
        return msg.send(`http://faceup.me/img?overlay=${type}&src=${url}`);
      });
    }
  });
};

imageMe = function(msg, query, cb) {
  return msg.http('http://ajax.googleapis.com/ajax/services/search/images').query({
    v: "1.0",
    rsz: '8',
    q: query
  }).get()(function(err, res, body) {
    var image, images;
    images = JSON.parse(body);
    images = images.responseData.results;
    image = msg.random(images);
    return cb(`${image.unescapedUrl}`);
  });
};
