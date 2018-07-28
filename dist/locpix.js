// Description:
//   Hubot searches the Library of Congress image archives

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot locpix me <query> - Search the Library of Congress image archives

// Author:
//   pj4533
module.exports = function(robot) {
  return robot.respond(/locpix?(?: me)? (.*)/i, function(msg) {
    var q;
    q = escape(msg.match[1]);
    return msg.http('http://www.loc.gov/pictures/search/?fo=json&fa=displayed:anywhere&q=' + q).get()(function(err, res, body) {
      var image, images, response;
      response = JSON.parse(body);
      images = response.results;
      if (images.length > 0) {
        image = msg.random(images);
        return msg.send(image.image.full);
      }
    });
  });
};
