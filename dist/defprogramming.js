// Description:
//   None

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect": "0.2.0"

// Configuration:
//   None

// Commands:
//   hubot def programming - Display a random programming quote from defprogramming.com

// Author:
//   daviferreira
var HtmlParser, Select;

Select = require("soupselect").select;

HtmlParser = require("htmlparser");

module.exports = function(robot) {
  return robot.respond(/def programming/i, function(msg) {
    return msg.http("http://www.defprogramming.com/random").get()(function(err, res, body) {
      var handler, parser, results;
      handler = new HtmlParser.DefaultHandler();
      parser = new HtmlParser.Parser(handler);
      parser.parseComplete(body);
      results = Select(handler.dom, "cite a p");
      return msg.send(results[0].children[0].raw);
    });
  });
};
