// Description:
//   Grab XKCD comic image urls

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot xkcd [latest]- The latest XKCD comic
//   hubot xkcd <num> - XKCD comic <num>
//   hubot xkcd random - XKCD comic <num>

// Author:
//   twe4ked
//   Hemanth (fixed the max issue)
module.exports = function(robot) {
  robot.respond(/xkcd(\s+latest)?$/i, function(msg) {
    return msg.http("http://xkcd.com/info.0.json").get()(function(err, res, body) {
      var object;
      if (res.statusCode === 404) {
        return msg.send('Comic not found.');
      } else {
        object = JSON.parse(body);
        return msg.send(object.title, object.img, object.alt);
      }
    });
  });
  robot.respond(/xkcd\s+(\d+)/i, function(msg) {
    var num;
    num = `${msg.match[1]}`;
    return msg.http(`http://xkcd.com/${num}/info.0.json`).get()(function(err, res, body) {
      var object;
      if (res.statusCode === 404) {
        return msg.send('Comic #{num} not found.');
      } else {
        object = JSON.parse(body);
        return msg.send(object.title, object.img, object.alt);
      }
    });
  });
  return robot.respond(/xkcd\s+random/i, function(msg) {
    return msg.http("http://xkcd.com/info.0.json").get()(function(err, res, body) {
      var max, num;
      if (res.statusCode === 404) {
        return max = 0;
      } else {
        max = JSON.parse(body).num;
        num = Math.floor((Math.random() * max) + 1);
        return msg.http(`http://xkcd.com/${num}/info.0.json`).get()(function(err, res, body) {
          var object;
          object = JSON.parse(body);
          return msg.send(object.title, object.img, object.alt);
        });
      }
    });
  });
};
