// Description:
//   Feeling depressed?

// Dependencies:
//   None

// Configuration:
//   Store your imgur.com application client id in an environment
//   variable called IMGUR_CLIENT_ID. To get API access, visit
//   http://api.imgur.com and register an application.

// Commands:
//   hubot cheer me up - A little pick me up

// Author:
//   carllerche
var aww;

module.exports = function(robot) {
  robot.respond(/cheer me up/i, function(msg) {
    return aww(msg);
  });
  return robot.hear(/i( am|'m) emo/i, function(msg) {
    msg.send("Let me cheer you up.");
    return aww(msg);
  });
};

aww = function(msg) {
  var client_id;
  client_id = 'Client-ID ' + process.env.IMGUR_CLIENT_ID;
  return msg.http('https://api.imgur.com/3/gallery/r/aww').headers({
    Authorization: client_id
  }).get()(function(err, res, body) {
    var image, images;
    images = JSON.parse(body);
    images = images.data;
    image = msg.random(images);
    return msg.send(image.link);
  });
};
