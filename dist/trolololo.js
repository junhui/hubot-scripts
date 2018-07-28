// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   HUBOT_IMGUR_CLIENT_ID

// Commands:
//   trol.* - returns one of many alternative trollfaces when trolling is
//   mentioned (troll, trolling, trolololololo...)

// Author:
//   ajacksified
var https, options;

https = require('https');

options = {
  hostname: 'api.imgur.com',
  path: '/3/album/pTXm0',
  headers: {
    'Authorization': `Client-ID ${process.env.HUBOT_IMGUR_CLIENT_ID}`
  }
};

module.exports = function(robot) {
  return robot.hear(/\btrol\w+?\b/i, function(msg) {
    var data;
    data = [];
    return https.get(options, function(res) {
      if (res.statusCode === 200) {
        res.on('data', function(chunk) {
          return data.push(chunk);
        });
        return res.on('end', function() {
          var image, images, parsedData;
          parsedData = JSON.parse(data.join(''));
          images = parsedData.data.images;
          image = images[parseInt(Math.random() * images.length)];
          return msg.send(image.link);
        });
      }
    });
  });
};
