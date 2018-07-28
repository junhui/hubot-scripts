// Description:
//   Post screencast image link

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   http://screencast.com/... - Display image from Screencast

// Author:
//   Chris Larson
var HTMLParser, Select;

Select = require("soupselect").select;

HTMLParser = require("htmlparser");

module.exports = function(robot) {
  return robot.hear(/(http:\/\/)?screencast.com\/t\/([^\s]*)/i, function(msg) {
    var SCShortId, error;
    SCShortId = escape(msg.match[2]);
    try {
      return msg.http("http://screencast.com/t/" + SCShortId).get()(function(err, resp, body) {
        var error, htmlHandler, htmlParser, url;
        htmlHandler = new HTMLParser.DefaultHandler((function() {}), {
          ignoreWhitespace: true
        });
        htmlParser = new HTMLParser.Parser(htmlHandler);
        htmlParser.parseComplete(body);
        try {
          url = Select(htmlHandler.dom, "img.embeddedObject")[0].attribs.src;
        } catch (error1) {
          error = error1;
        }
        return msg.send(url);
      });
    } catch (error1) {
      error = error1;
    }
  });
};
