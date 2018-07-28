// Description:
//   Returns a random image from pinterest

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect: "0.2.0"

// Configuration:
//   None

// Commands:
//   hubot pin|pinterest me <query> - Returns a random image from pinterest for <query>

// Author:
//   rasyidmujahid 
var get_pin_img, get_pin_url, html_handler, html_parser, htmlparser, http, pin_me, select;

select = require("soupselect").select;

htmlparser = require("htmlparser");

html_handler = new htmlparser.DefaultHandler((function() {}), {
  ignoreWhitespace: true
});

html_parser = new htmlparser.Parser(html_handler);

module.exports = function(robot) {
  return robot.respond(/(pin|pinterest)( me)? (.*)/i, function(msg) {
    return pin_me(msg, 'http://pinterest.com/search/pins/?', msg.match[3], function(url) {
      return msg.send(url);
    });
  });
};

pin_me = function(msg, url, query, cb) {
  return http(msg, url, query, function(err, res, body) {
    var pin_url;
    pin_url = get_pin_url(body, 'a.PinImage.ImgLink');
    if (pin_url != null) {
      return http(msg, pin_url, null, function(err, res, body) {
        return cb(get_pin_img(body, 'img#pinCloseupImage'));
      });
    } else {
      return cb('Sorry no pin found.');
    }
  });
};

http = function(msg, url, query, cb) {
  return msg.http(url).query({
    q: query
  }).get()(cb);
};

get_pin_url = function(body, selector) {
  var idx, pins;
  html_parser.parseComplete(body);
  pins = select(html_handler.dom, selector);
  if (pins.length <= 0) {
    return null;
  }
  idx = Math.floor(Math.random() * pins.length);
  return 'http://pinterest.com' + pins[idx].attribs.href;
};

get_pin_img = function(body, selector) {
  html_parser.parseComplete(body);
  return select(html_handler.dom, selector)[0].attribs.src;
};
