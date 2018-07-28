// Description:
//   Random gif from gifbin.com

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect: "0.2.0"

// Configuration:
//   None

// Commands:
//   hubot gifbin me - Return random gif from gifbin.com

// Author:
//   EnriqueVidal
var HTMLParser, Select, get_gif, gif_domain, send_gif;

Select = require("soupselect").select;

HTMLParser = require("htmlparser");

gif_domain = "http://www.gifbin.com";

module.exports = function(robot) {
  return robot.respond(/gifbin( me)?/i, function(message) {
    return send_gif(message, false, function(text) {
      return message.send(text);
    });
  });
};

send_gif = function(message, location, response_handler) {
  location || (location = gif_domain + "/random");
  return message.http(location).get()(function(error, response, body) {
    if (error) {
      return response_handler("Sorry, something went wrong");
    }
    if (response.statusCode === 301) {
      location = response.headers['location'];
      return send_gif(message, location, response_handler);
    }
    return response_handler(get_gif(body, ".box a img"));
  });
};

get_gif = function(body, selector) {
  var html_handler, html_parser;
  html_handler = new HTMLParser.DefaultHandler((function() {}), {
    ignoreWhitespace: true
  });
  html_parser = new HTMLParser.Parser(html_handler);
  html_parser.parseComplete(body);
  return Select(html_handler.dom, selector)[0].attribs.src;
};
