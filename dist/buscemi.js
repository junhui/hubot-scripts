// Description:
//   HOLY FUCKING MINDFUCK!

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot buscemi me <url> - Adds Steve Buscemi eyes to the specified URL
//   hubot buscemi me <query> - Searches Google Images for the specified query and buscemi's it

// Author:
//   dylanegan
var imageMe;

module.exports = function(robot) {
  return robot.respond(/buscemi?(?: me)? (.*)/i, function(msg) {
    var buscemi, imagery;
    buscemi = "http://buscemi.heroku.com?src=";
    imagery = msg.match[1];
    if (imagery.match(/^https?:\/\//i)) {
      return msg.send(`${buscemi}${imagery}`);
    } else {
      return imageMe(msg, imagery, function(url) {
        return msg.send(`${buscemi}${url}`);
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
    return cb(`${image.unescapedUrl}#.png`);
  });
};
