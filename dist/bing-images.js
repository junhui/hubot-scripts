// Description:
//   Queries Bing and returns a random image from the top 50 images found using Bing API

// Dependencies:
//   None

// Configuration:
//   HUBOT_BING_ACCOUNT_KEY

// Commands:
//   bing image <query> - Queries Bing Images for <query> & returns a random result from top 50

// Author:
//   Brandon Satrom
var bingAccountKey, imageMe;

bingAccountKey = process.env.HUBOT_BING_ACCOUNT_KEY;

if (!bingAccountKey) {
  throw "You must set HUBOT_BING_ACCOUNT_KEY in your environment vairables";
}

module.exports = function(robot) {
  return robot.hear(/^bing( image)? (.*)/i, function(msg) {
    return imageMe(msg, msg.match[2], function(url) {
      return msg.send(url);
    });
  });
};

imageMe = function(msg, query, cb) {
  return msg.http('https://api.datamarket.azure.com/Bing/Search/Image').header("Authorization", "Basic " + new Buffer(`${bingAccountKey}:${bingAccountKey}`).toString('base64')).query({
    Query: "'" + query + "'",
    $format: "json",
    $top: 50
  }).get()(function(err, res, body) {
    var error, image, images;
    try {
      images = JSON.parse(body).d.results;
      image = msg.random(images);
      return cb(image.MediaUrl);
    } catch (error1) {
      error = error1;
      return cb(body);
    }
  });
};
