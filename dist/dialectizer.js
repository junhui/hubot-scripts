// Description:
//   Allows Hubot to translate text into various dialects

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect: "0.2.0"

// Configuration:
//   None

// Commands:
//   hubot dialectize|dialect|dia <dialect>|help <text> - Translates the given text into the given dialect

// Author:
//   facto
var HtmlParser, Select, dialects, showDialectizedText, showHelp, trim;

Select = require("soupselect").select;

HtmlParser = require("htmlparser");

//TODO: get this dynamically?
dialects = ["redneck", "jive", "cockney", "fudd", "bork", "moron", "piglatin", "hckr", "censor"];

module.exports = function(robot) {
  return robot.respond(/(?:dialectize|dialect|dia) (\w+)(.*)/i, function(msg) {
    var dialect, i, len, text;
    [dialect, text] = msg.match.slice(1, 3);
    if (dialect === "help" || dialect === "h") {
      showHelp(msg);
      return;
    }
    if (!text) {
      return;
    }
    trim(text);
    if (!(text.length > 0)) {
      return;
    }
    if (dialect === "all" || dialect === "a") {
      for (i = 0, len = dialects.length; i < len; i++) {
        dialect = dialects[i];
        showDialectizedText(msg, dialect, text, true);
      }
      return;
    } else if (dialect === "hacker") {
      dialect = "hckr";
    }
    return showDialectizedText(msg, dialect, text, false);
  });
};

showDialectizedText = function(msg, dialect, text, showPrefix) {
  return msg.http("http://www.rinkworks.com/dialect/dialectt.cgi?dialect=" + encodeURIComponent(dialect) + "&text=" + encodeURIComponent(text)).get()(function(err, res, body) {
    var dialectizedText, handler, parser, result;
    handler = new HtmlParser.DefaultHandler();
    parser = new HtmlParser.Parser(handler);
    parser.parseComplete(body);
    result = Select(handler.dom, ".dialectized_text p");
    if (!result) {
      return;
    }
    dialectizedText = trim(result[0].children[0].raw);
    if (showPrefix) {
      dialectizedText = `${dialect}: ` + dialectizedText;
    }
    return msg.send(dialectizedText);
  });
};

showHelp = function(msg) {
  return msg.send("Dialects: " + dialects.join(", "));
};

trim = function(string) {
  return string.replace(/^\s*|\s*$/g, '');
};
