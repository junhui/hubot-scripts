// Description:
//   Show random filewise invisible

// Dependencies:
//   "cheerio": "0.10.5"

// Configuration:
//   None

// Commands:
//   hubot filmwise me - a randomly selected filmwise invisible
//   hubot filmwise bomb <number> - filmwise invisible explosion!
//   hubot filmwise answer (or cheat) - show the answer to the last filmwise shown
//   hubot filmwise guess <answer> - guess the answer

// Author:
//   mwongatemma, lroggendorff
var $, show_filmwise;

$ = require("cheerio");

module.exports = function(robot) {
  robot.respond(/filmwise\s*(?:me)?$/i, function(msg) {
    var answerImgSrc, answerUrl;
    robot.brain.data.lastfilm = show_filmwise(msg, 1);
    msg.send(robot.brain.data.lastfilm.replace);
    answerUrl = robot.brain.data.lastfilm.replace(/\/image_0\d+\.jpg$/, "a.shtml");
    answerImgSrc = robot.brain.data.lastfilm.match(/(invisible_\d+\/image_0\d+)\.jpg$/);
    answerImgSrc = answerImgSrc[1] + "a.jpg";
    return msg.http(answerUrl).get()(function(err, res, body) {
      return robot.brain.data.lastfilmanswer = $(body).find('img[src$="' + answerImgSrc + '"]').next().next().text();
    });
  });
  robot.respond(/filmwise\s+(?:bomb)\s*(?:me)?\s*(\d+)?/i, function(msg) {
    var count;
    count = msg.match[1] || 5;
    return robot.brain.data.lastfilm = show_filmwise(msg, count);
  });
  robot.respond(/filmwise\s+(?:guess)\s*(.+)?/i, function(msg) {
    var guess;
    // The double quotes aren't stripped from the answer web page
    guess = '"' + msg.match[1] + '"';
    if (robot.brain.data.lastfilmanswer.toLowerCase() === guess.toLowerCase()) {
      return msg.send(msg.message.user.name + ': You guessed ' + guess + ' correctly!');
    } else {
      return msg.send(msg.message.user.name + ': You guessed ' + guess + ' incorrectly!');
    }
  });
  return robot.respond(/filmwise\s+(?:answer|cheat)?$/i, function(msg) {
    var answerImgSrc, answerUrl, title;
    title = "";
    answerUrl = robot.brain.data.lastfilm.replace(/\/image_0\d+\.jpg$/, "a.shtml");
    answerImgSrc = robot.brain.data.lastfilm.match(/(invisible_\d+\/image_0\d+)\.jpg$/);
    answerImgSrc = answerImgSrc[1] + "a.jpg";
    msg.http(answerUrl).get()(function(err, res, body) {
      return msg.send($(body).find('img[src$="' + answerImgSrc + '"]').next().next().text());
    });
    return msg.send(robot.brain.data.lastfilm.replace(/\.jpg$/, "a.jpg"));
  });
};

show_filmwise = function(msg, count) {
  var WEEK, d1, d2, i, image, j, lastFilm, passed, ref, week;
  WEEK = 1000 * 60 * 60 * 24 * 7;
  // This is the first week of images currently available.
  d1 = new Date('09/13/2010');
  d2 = new Date();
  passed = Math.floor((d2.getTime() - d1.getTime()) / WEEK);
  lastFilm = "";
  for (i = j = 1, ref = count; (1 <= ref ? j <= ref : j >= ref); i = 1 <= ref ? ++j : --j) {
    week = 501 + Math.floor(Math.random() * passed);
    image = 1 + Math.floor(Math.random() * 8);
    lastFilm = "http://filmwise.com/invisibles/invisible_" + String(week + "/image_0" + String(image + ".jpg"));
    msg.send(lastFilm);
  }
  return lastFilm;
};
