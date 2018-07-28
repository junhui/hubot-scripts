// Description:
//   Dilbert

// Dependencies:
//   "htmlparser": "1.7.6"

// Configuration:
//   None

// Commands:
//   hubot show me dilbert - gets the daily dilbert

// Author:
//   evilmarty
var dilbertRegexp, dilbertRss, htmlparser;

htmlparser = require("htmlparser");

module.exports = function(robot) {
  return robot.respond(/((show|fetch)( me )?)?dilbert/i, function(msg) {
    return dilbertRss(msg, function(url) {
      return msg.send(url);
    });
  });
};

dilbertRegexp = /src=&quot;(.*.gif)/i;

dilbertRss = function(msg, cb) {
  return msg.http('http://pipes.yahoo.com/pipes/pipe.run?_id=1fdc1d7a66bb004a2d9ebfedfb3808e2&_render=rss').get()(function(err, resp, body) {
    var handler, parser;
    handler = new htmlparser.RssHandler(function(error, dom) {
      var item, match;
      if (error || !dom) {
        return;
      }
      item = dom.items[0];
      match = item.description.match(dilbertRegexp);
      if (match) {
        return cb(match[1]);
      }
    });
    parser = new htmlparser.Parser(handler);
    return parser.parseComplete(body);
  });
};
