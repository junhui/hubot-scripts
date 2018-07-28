// Description:
//   Hacker News

// Dependencies:
//   "nodepie": "0.5.0"

// Configuration:
//   None

// Commands:
//   hubot hn top <N> - get the top N items on hacker news (or your favorite RSS feed)
//   hn.top - refer to the top item on hn
//   hn[i] - refer to the ith item on hn

// Author:
//   skimbrel
var NodePie, hnFeedUrl;

NodePie = require("nodepie");

hnFeedUrl = "https://news.ycombinator.com/rss";

module.exports = function(robot) {
  robot.respond(/HN top (\d+)?/i, function(msg) {
    return msg.http(hnFeedUrl).get()(function(err, res, body) {
      var count, e, feed, i, item, items, len, ref, results;
      if (res.statusCode === !200) {
        return msg.send("Something's gone awry");
      } else {
        feed = new NodePie(body);
        try {
          feed.init();
          count = msg.match[1] || 5;
          items = feed.getItems(0, count);
          results = [];
          for (i = 0, len = items.length; i < len; i++) {
            item = items[i];
            results.push(msg.send(item.getTitle() + ": " + item.getPermalink() + " (" + ((ref = item.getComments()) != null ? ref.html : void 0) + ")"));
          }
          return results;
        } catch (error) {
          e = error;
          console.log(e);
          return msg.send("Something's gone awry");
        }
      }
    });
  });
  return robot.hear(/HN(\.top|\[\d+\])/i, function(msg) {
    return msg.http(hnFeedUrl).get()(function(err, res, body) {
      var e, element, feed, idx, item, ref;
      if (res.statusCode === !200) {
        return msg.send("Something's gone awry");
      } else {
        feed = new NodePie(body);
        try {
          feed.init();
        } catch (error) {
          e = error;
          console.log(e);
          msg.send("Something's gone awry");
        }
        element = msg.match[1];
        if (element === "HN.top") {
          idx = 0;
        } else {
          idx = Number(msg.match[0].replace(/[^0-9]/g, '') - 1);
        }
        try {
          item = feed.getItems()[idx];
          return msg.send(item.getTitle() + ": " + item.getPermalink() + " (" + ((ref = item.getComments()) != null ? ref.html : void 0) + ")");
        } catch (error) {
          e = error;
          console.log(e);
          return msg.send("Something's gone awry");
        }
      }
    });
  });
};
