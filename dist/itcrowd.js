// Description:
//   Make hubot fetch quotes pertaining The IT Crowd

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect": "0.2.0"
//   "jsdom": "0.2.14"
//   "underscore": "1.3.3"

// Configuration:
//   None

// Commands:

// Author:
//   rrix
var HtmlParser, JsDom, Select, _, children_of_type, get_dom, get_quote, parse_html;

Select = require("soupselect").select;

HtmlParser = require("htmlparser");

JsDom = require("jsdom");

_ = require("underscore");

module.exports = function(robot) {
  return robot.respond(/itcrowd quote$/i, function(msg) {
    return msg.http("http://en.wikiquote.org/wiki/The_IT_Crowd").header("User-Agent: Crowdbot for Hubot (+https://github.com/github/hubot-scripts)").get()(function(err, res, body) {
      var quote, quotes;
      quotes = parse_html(body, "dl");
      return quote = get_quote(msg, quotes);
    });
  });
};

get_quote = function(msg, quotes) {
  var nodeChildren, quote, textNode;
  nodeChildren = _.flatten(children_of_type(quotes[Math.floor(Math.random() * quotes.length)]));
  quote = ((function() {
    var i, len, results;
    results = [];
    for (i = 0, len = nodeChildren.length; i < len; i++) {
      textNode = nodeChildren[i];
      results.push(textNode.data);
    }
    return results;
  })()).join(' ').replace(/^\s+|\s+$/g, '');
  return msg.send(quote);
};

// Helpers
parse_html = function(html, selector) {
  var handler, parser;
  handler = new HtmlParser.DefaultHandler((function() {}), {
    ignoreWhitespace: true
  });
  parser = new HtmlParser.Parser(handler);
  parser.parseComplete(html);
  return Select(handler.dom, selector);
};

children_of_type = function(root) {
  var child, ref;
  if ((root != null ? root.type : void 0) === "text") {
    return [root];
  }
  if ((root != null ? (ref = root.children) != null ? ref.length : void 0 : void 0) > 0) {
    return (function() {
      var i, len, ref1, results;
      ref1 = root.children;
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        child = ref1[i];
        results.push(children_of_type(child));
      }
      return results;
    })();
  }
};

get_dom = function(xml) {
  var body;
  body = JsDom.jsdom(xml);
  if (body.getElementsByTagName("FilterReturn")[0].childNodes.length === 0) {
    throw Error("No XML data returned.");
  }
  return body;
};
