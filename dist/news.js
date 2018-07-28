// Description:
//   Returns the latest news headlines from Google

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot news - Get the latest headlines
//   hubot news <topic> - Get the latest headlines for a specific topic

// Author:
//   Matt McCormick
module.exports = function(robot) {
  var complete, query;
  robot.respond(/news(?: me| on)?\s?(.*)/, function(msg) {
    return query(msg, function(response, err) {
      var i, len, ref, story, strings, topic;
      if (err) {
        return msg.send(err);
      }
      strings = [];
      topic = msg.match[1];
      if (topic !== "") {
        strings.push(`Here's the latest news on "${topic}":\n`);
      } else {
        strings.push("Here's the latest news headlines:\n");
      }
      ref = response.responseData.results;
      for (i = 0, len = ref.length; i < len; i++) {
        story = ref[i];
        strings.push(story.titleNoFormatting.replace(/&#39;/g, "'").replace(/`/g, "'").replace(/&quot;/g, "\""));
        strings.push(story.unescapedUrl + "\n");
      }
      return msg.send(strings.join("\n"));
    });
  });
  query = function(msg, cb) {
    if (msg.match[1] !== "") {
      return msg.http("https://ajax.googleapis.com/ajax/services/search/news?v=1.0&rsz=5").query({
        q: msg.match[1]
      }).get()(function(err, res, body) {
        return complete(cb, body, err);
      });
    } else {
      return msg.http("https://ajax.googleapis.com/ajax/services/search/news?v=1.0&rsz=5&topic=h").get()(function(err, res, body) {
        return complete(cb, body, err);
      });
    }
  };
  return complete = function(cb, body, err) {
    var response;
    try {
      response = JSON.parse(body);
    } catch (error) {
      err = error;
      err = "Sorry, but I could not fetch the latest headlines.";
    }
    return cb(response, err);
  };
};
