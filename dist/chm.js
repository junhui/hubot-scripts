// Description:
//   Shows a short history lesson of the day from the Computer History Museum

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect: "0.2.0"

// Configuration:
//   None

// Commands:
//   hubot today in computer history|tdih|chm - Displays the content from the This Day in History page on the Computer History Museum site

// Author:
//   facto
var HtmlParser, Select, blurbSentences, date, title, trim;

Select = require("soupselect").select;

HtmlParser = require("htmlparser");

module.exports = function(robot) {
  return robot.respond(/(today in computer history|tdih|chm)$/i, function(msg) {
    return msg.http("http://www.computerhistory.org/tdih/").get()(function(err, res, body) {
      var contentEl, handler, i, len, parser, ref, results, sentence;
      handler = new HtmlParser.DefaultHandler();
      parser = new HtmlParser.Parser(handler);
      parser.parseComplete(body);
      contentEl = Select(handler.dom, ".tdihevent p");
      if (!contentEl) {
        return;
      }
      msg.send(date(handler));
      msg.send(title(contentEl));
      ref = blurbSentences(contentEl);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        sentence = ref[i];
        if (sentence && sentence !== "") {
          results.push(msg.send(sentence + '.'));
        } else {
          results.push(void 0);
        }
      }
      return results;
    });
  });
};

title = function(contentEl) {
  return trim(contentEl[0].children[0].raw);
};

blurbSentences = function(contentEl) {
  var blurb;
  blurb = trim(contentEl[1].children[0].raw);
  return blurb.split('.');
};

date = function(handler) {
  var dateEl;
  dateEl = Select(handler.dom, ".title");
  if (!dateEl) {
    return "";
  }
  return trim(dateEl[0].children[0].raw);
};

trim = function(string) {
  return string.replace(/^\s*|\s*$/g, '');
};
