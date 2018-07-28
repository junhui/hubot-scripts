// Description
//   Blames Obama for everything that's bad in your life.

// Dependencies:
//   "cheerio": "0.10.7",
//   "request": "2.14.0"

// Configuration:
//   None

// Commands:
//   thanks obama - A random image from http://thanks-obama.tumblr.com

// Notes:
//   It would be nice if we could load a larger sample of images.

// Author:
//   raykrueger

var cheerio, request, url;

request = require('request');

cheerio = require('cheerio');

url = "http://thanks-obama.tumblr.com/";

module.exports = function(robot) {
  return robot.hear(/thanks obama/i, function(msg) {
    return request(`${url}?page=${Math.floor(Math.random() * 8)}`, function(error, response, body) {
      var $, image, images;
      if (error) {
        throw error;
      }
      $ = cheerio.load(body);
      images = $("div.cont.group img").toArray();
      image = images[Math.floor(Math.random() * images.length)];
      if (image) {
        return msg.send($(image).attr("src"));
      }
    });
  });
};
