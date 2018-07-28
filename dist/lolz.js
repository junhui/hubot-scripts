// Description:
//   None

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect: "0.2.0"

// Configuration:
//   None

// Commands:
//   hubot lulz - BRING THE LOLZ from bukk.it

// Author:
//   dstrelau
var HtmlParser, Select;

Select = require("soupselect").select;

HtmlParser = require("htmlparser");

module.exports = function(robot) {
  robot.respond(/l[ou]lz$/i, function(msg) {
    return msg.http("http://bukk.it").get()(function(err, res, body) {
      var handler, link, parser, results;
      handler = new HtmlParser.DefaultHandler();
      parser = new HtmlParser.Parser(handler);
      parser.parseComplete(body);
      results = (function() {
        var i, len, ref, results1;
        ref = Select(handler.dom, "td a");
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          link = ref[i];
          results1.push(`http://bukk.it/${link.attribs.href}`);
        }
        return results1;
      })();
      return msg.send(msg.random(results));
    });
  });
  return robot.respond(/l[ou]lz\s*bomb (\d+)?/i, function(msg) {
    var count;
    count = msg.match[1] || 5;
    if (count > 20) {
      count = 5;
    }
    return msg.http("http://bukk.it").get()(function(err, res, body) {
      var handler, i, link, num, parser, ref, results, results1;
      handler = new HtmlParser.DefaultHandler();
      parser = new HtmlParser.Parser(handler);
      parser.parseComplete(body);
      results = (function() {
        var i, len, ref, results1;
        ref = Select(handler.dom, "td a");
        results1 = [];
        for (i = 0, len = ref.length; i < len; i++) {
          link = ref[i];
          results1.push(`http://bukk.it/${link.attribs.href}`);
        }
        return results1;
      })();
      results1 = [];
      for (num = i = ref = count; (ref <= 1 ? i <= 1 : i >= 1); num = ref <= 1 ? ++i : --i) {
        results1.push(msg.send(msg.random(results)));
      }
      return results1;
    });
  });
};
