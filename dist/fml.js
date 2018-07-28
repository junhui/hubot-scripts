// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot fml - A random message from fmylife.com

// Author:
//   artfuldodger
var fml;

module.exports = function(robot) {
  return robot.respond(/fml/i, function(msg) {
    return fml(msg);
  });
};

fml = function(msg) {
  return msg.http('http://ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=10&q=http://feeds.feedburner.com/fmylife').get()(function(err, res, body) {
    var fmls, random, text;
    fmls = JSON.parse(body);
    random = Math.floor(Math.random() * fmls.responseData.feed.entries.length);
    text = fmls.responseData.feed.entries[random].content;
    text = text.slice(0, +(text.indexOf('<img') - 1) + 1 || 9e9);
    return msg.send(text);
  });
};
