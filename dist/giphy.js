// Description:
//   A way to search images on giphy.com

// Configuration:
//   HUBOT_GIPHY_API_KEY

// Commands:
//   hubot gif me <query> - Returns an animated gif matching the requested search term.
var giphy, giphyMe;

giphy = {
  api_key: process.env.HUBOT_GIPHY_API_KEY,
  base_url: 'http://api.giphy.com/v1'
};

module.exports = function(robot) {
  return robot.respond(/(gif|giphy)( me)? (.*)/i, function(msg) {
    return giphyMe(msg, msg.match[3], function(url) {
      return msg.send(url);
    });
  });
};

giphyMe = function(msg, query, cb) {
  var endpoint, url;
  endpoint = '/gifs/search';
  url = `${giphy.base_url}${endpoint}`;
  return msg.http(url).query({
    q: query,
    api_key: giphy.api_key
  }).get()(function(err, res, body) {
    var e, image, images, response;
    response = void 0;
    try {
      response = JSON.parse(body);
      images = response.data;
      if (images.length > 0) {
        image = msg.random(images);
        cb(image.images.original.url);
      }
    } catch (error) {
      e = error;
      response = void 0;
      cb('Error');
    }
    if (response === void 0) {

    }
  });
};
