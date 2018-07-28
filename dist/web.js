// Description:
//   Webutility returns title of urls

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect": "0.2.0"
//   "jsdom": "0.2.14"

// Configuration:
//   HUBOT_BITLY_USERNAME
//   HUBOT_BITLY_API_KEY

// Commands:
//   None

// Author:
//   KevinTraver
var HtmlParser, JSDom, Select, unEntity;

Select = require("soupselect").select;

HtmlParser = require("htmlparser");

JSDom = require("jsdom");

// Decode HTML entities
unEntity = function(str) {
  var e;
  e = JSDom.jsdom().createElement("div");
  e.innerHTML = str;
  if (e.childNodes.length === 0) {
    return "";
  } else {
    return e.childNodes[0].nodeValue;
  }
};

module.exports = function(robot) {
  return robot.hear(/(http|ftp|https):\/\/[\w\-_]+(\.[\w\-_]+)+([\w\-\.,@?^=%&amp;:\/~\+#]*[\w\-\@?^=%&amp;\/~\+#])?/i, function(msg) {
    var httpBitlyResponse, httpResponse, url;
    url = msg.match[0];
    httpResponse = function(url) {
      return msg.http(url).get()(function(err, res, body) {
        var RangeError, handler, parser, processResult, results;
        if (res.statusCode === 301 || res.statusCode === 302) {
          return httpResponse(res.headers.location);
        } else if (res.statusCode === 200) {
          if (res.headers['content-type'].indexOf('text/html') !== 0) {
            return;
          }
          handler = new HtmlParser.DefaultHandler();
          parser = new HtmlParser.Parser(handler);
          parser.parseComplete(body);
          try {
            // abort if soupselect runs out of stack space
            results = Select(handler.dom, "head title");
          } catch (error) {
            RangeError = error;
            return;
          }
          processResult = function(elem) {
            return unEntity(elem.children[0].data.replace(/(\r\n|\n|\r)/gm, "").trim());
          };
          if (results[0]) {
            return msg.send(processResult(results[0]));
          } else {
            results = Select(handler.dom, "title");
            if (results[0]) {
              return msg.send(processResult(results[0]));
            }
          }
        } else {
          return msg.send("Error " + res.statusCode);
        }
      });
    };
    httpBitlyResponse = function(url) {
      return msg.http("http://api.bitly.com/v3/info").query({
        login: process.env.HUBOT_BITLY_USERNAME,
        apiKey: process.env.HUBOT_BITLY_API_KEY,
        shortUrl: url,
        format: "json"
      }).get()(function(err, res, body) {
        var response, responseTitle;
        response = JSON.parse(body);
        responseTitle = response.data.info[0].title.replace(/(\r\n|\n|\r)/gm, "").trim();
        if (responseTitle) {
          return msg.send(response.status_code === 200 ? responseTitle : response.status_txt);
        } else {
          return httpResponse(url);
        }
      });
    };
    if (url.match(/https?:\/\/(mobile\.)?twitter\.com/i)) {
      return console.log("Twitter link; ignoring");
    } else if (url.match(/^http\:\/\/bit\.ly/)) {
      return httpBitlyResponse(url);
    } else {
      return httpResponse(url);
    }
  });
};
