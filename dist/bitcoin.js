// Description:
//   Find the latest Bitcoin price in specified currency

// Dependencies:
//   "cheerio": ""

// Configuration:
//   None

// Commands:
//   hubot bitcoin price (in) <currency>

// Author:
//   Fred Wu
var bitcoinPrice, cheerio, getPrice;

cheerio = require('cheerio');

module.exports = function(robot) {
  return robot.respond(/bitcoin price\s(in\s)?(.*)/i, function(msg) {
    var currency;
    currency = msg.match[2].trim().toUpperCase();
    return bitcoinPrice(msg, currency);
  });
};

bitcoinPrice = function(msg, currency) {
  msg.send("Looking up... sit tight...");
  return msg.http("http://bitcoinprices.com/").get()(function(err, res, body) {
    return msg.send(`${getPrice(currency, body)}`);
  });
};

getPrice = function(currency, body) {
  var $, highPrice, lastPrice, lowPrice, priceSymbol;
  $ = cheerio.load(body);
  lastPrice = null;
  highPrice = null;
  lowPrice = null;
  priceSymbol = null;
  $('table.currencies td.symbol').each(function(i) {
    if ($(this).text() === currency) {
      priceSymbol = $(this).next().next().next().next().next().next().text();
      lastPrice = `${priceSymbol}${$(this).next().next().next().next().next().text()}`;
      highPrice = `${priceSymbol}${$(this).next().next().next().text()}`;
      lowPrice = `${priceSymbol}${$(this).next().next().next().next().text()}`;
      return false;
    }
  });
  if (lastPrice === null) {
    return `Can't find the price for ${currency}. :(`;
  } else {
    return `${currency}: ${lastPrice} (H: ${highPrice} | L: ${lowPrice})`;
  }
};
