// Description
//   The plugin will provide a picture and a link of the daily deal from Steam

// Dependencies:
//   "htmlparser": "1.8.0"
//   "soupselect": "0.2.0"
//   "validator" : "0.4.20"

// Configuration:
//   None

// Commands:
//   hubot daily deal - <It will show you Steam's daily deal>

// Notes:
//   soupselect depends on htmlparser so install both using "npm install soupselect" and "npm install htmlparser". Don't forget: "npm install validator" 
//   You might need to be root user to install the dependencies

// Author:
//   smiklos
var HTMLParser, Select, getDeals, parseDeals, sanitize;

Select = require("soupselect").select;

HTMLParser = require("htmlparser");

sanitize = require('validator').sanitize;

module.exports = function(robot) {
  return robot.respond(/daily deal/i, function(msg) {
    return getDeals(msg, function(deal) {
      return msg.send(deal[0], deal[1]);
    });
  });
};

getDeals = function(msg, callback) {
  var location;
  location = "http://store.steampowered.com";
  return msg.http(location).get()(function(error, response, body) {
    var deal;
    if (error) {
      return msg.send("Something went wrong...");
    }
    deal = parseDeals(body, ".dailydeal a");
    return callback(deal);
  });
};

parseDeals = function(body, selector) {
  var deal, dealObj, finalPrice, handler, image, originalPrice, parser, response;
  handler = new HTMLParser.DefaultHandler((function() {}), {
    ignoreWhitespace: true
  });
  parser = new HTMLParser.Parser(handler);
  parser.parseComplete(body);
  dealObj = Select(handler.dom, selector)[0];
  if (dealObj != null) {
    originalPrice = Select(handler.dom, '.dailydeal_content .discount_original_price')[0];
    finalPrice = Select(handler.dom, '.dailydeal_content .discount_final_price')[0];
    image = `${dealObj.children[0].attribs.src.replace(/[?].*/, '')}`;
    deal = `From ${sanitize(originalPrice.children[0].data).entityDecode().trim()} to ${sanitize(finalPrice.children[0].data).entityDecode().trim()} ${dealObj.attribs.href}`;
    return response = [image, deal];
  } else {
    return msg.send("No daily deal found");
  }
};
