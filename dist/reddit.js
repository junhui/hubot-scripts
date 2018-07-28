// Description:
//   None

// Dependencies:
//   "soupselect: "0.2.0"

// Configuration:
//   None

// Commands:
//   hubot reddit (me) <reddit> [limit] - Lookup reddit topic

// Author:
//   EnriqueVidal
var Select, lookup_site;

Select = require("soupselect").select;

lookup_site = "http://www.reddit.com/";

module.exports = function(robot) {
  var lookup_reddit;
  robot.respond(/reddit( me)? ([a-z0-9\-_\.]+\/?[a-z0-9\-_\.]+)( [0-9]+)?/i, function(message) {
    return lookup_reddit(message, function(text) {
      return message.send(text);
    });
  });
  return lookup_reddit = function(message, response_handler) {
    var location, reddit, top;
    top = parseInt(message.match[3]);
    reddit = "r/" + message.match[2] + ".json";
    location = lookup_site + reddit;
    return message.http(location).get()(function(error, response, body) {
      var count, i, item, len, list, results, text;
      if (error) {
        return response_handler("Sorry, something went wrong");
      }
      if (response.statusCode === 404) {
        return response_handler("Reddit doesn't know what you're talking about");
      }
      if (response.statusCode === 403) {
        return response_handler("Reddit doesn't want anyone to go there any more.");
      }
      list = JSON.parse(body).data.children;
      count = 0;
      results = [];
      for (i = 0, len = list.length; i < len; i++) {
        item = list[i];
        count++;
        text = (item.data.title || item.data.link_title) + " - " + (item.data.url || item.data.body);
        response_handler(text);
        if (count === top) {
          break;
        } else {
          results.push(void 0);
        }
      }
      return results;
    });
  };
};
