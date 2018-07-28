// Description:
//   Hubot delivers a pic from Reddit's /r/aww frontpage

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot aww - Display the picture from /r/aww

// Author:
//   eliperkins
var url;

url = require("url");

module.exports = function(robot) {
  return robot.respond(/aww/i, function(msg) {
    var search;
    search = escape(msg.match[1]);
    return msg.http('http://www.reddit.com/r/aww.json').get()(function(err, res, body) {
      var child, i, len, parsed_url, picked_url, ref, result, rnd, urls;
      result = JSON.parse(body);
      urls = [];
      ref = result.data.children;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        if (child.data.domain !== "self.aww") {
          urls.push(child.data.url);
        }
      }
      if (urls.count <= 0) {
        msg.send("Couldn't find anything cute...");
        return;
      }
      rnd = Math.floor(Math.random() * urls.length);
      picked_url = urls[rnd];
      parsed_url = url.parse(picked_url);
      if (parsed_url.host === "imgur.com") {
        parsed_url.host = "i.imgur.com";
        parsed_url.pathname = parsed_url.pathname + ".jpg";
        picked_url = url.format(parsed_url);
      }
      return msg.send(picked_url);
    });
  });
};
