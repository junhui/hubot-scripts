// Description
//   Philippe is standing on it.

// Dependencies:
//  "htmlparser": "1.7.6"
//  "soupselect": "0.2.0"

// Configuration:
//   None

// Commands:
//   hubot achewood - A random Achewood comic
//   hubot achewood current - The most recent Achewood comic
//   hubot achewood <date> - Achewood comic from <date> - mm/dd/yyyy format
//   hubot achewood <keyword> - Achewood comic for keyword
//   hubot saddest thing - The saddest thing, according to Lie Bot

// Author:
//   1000hz
var Select, htmlparser;

htmlparser = require("htmlparser");

Select = require("soupselect").select;

module.exports = function(robot) {
  var fetchAchewood, withDate;
  withDate = function(date) {
    return `http://achewood.com/index.php?date=${date}`;
  };
  fetchAchewood = function(msg, url) {
    return msg.http(url).get()(function(err, res, body) {
      var comic, handler, img, parser;
      handler = new htmlparser.DefaultHandler();
      parser = new htmlparser.Parser(handler);
      parser.parseComplete(body);
      img = Select(handler.dom, "img.comic");
      comic = img[0].attribs;
      msg.send("http://achewood.com" + comic.src + "#.png");
      return msg.send(comic.title);
    });
  };
  robot.respond(/achewood\s?((?:0[1-9]|1[0-2]).?(?:0[1-9]|[1-2][0-9]|3[0-1]).?(?:20\d{2})$|.*)?/i, function(msg) {
    var arg, date, query;
    arg = msg.match[1];
    if (arg === void 0) {
      return msg.http("http://www.ohnorobot.com/random.pl?comic=636").get()(function(err, res, body) {
        return fetchAchewood(msg, res.headers['location']);
      });
    } else if (arg === "current") {
      return fetchAchewood(msg, "http://achewood.com");
    } else if (arg.match(/\d{2}.?\d{2}.?\d{4}/)) {
      date = arg.replace(/\D/g, '');
      return fetchAchewood(msg, withDate(date));
    } else {
      query = arg;
      return msg.http(`http://www.ohnorobot.com/index.pl?comic=636&lucky=1&s=${query}`).get()(function(err, res, body) {
        return fetchAchewood(msg, res.headers['location']);
      });
    }
  });
  return robot.respond(/.*saddest thing\?*/i, function(msg) {
    var saddest;
    saddest = msg.random(["06022003", "11052001", "09052006", "07302007"]);
    return fetchAchewood(msg, withDate(saddest));
  });
};
