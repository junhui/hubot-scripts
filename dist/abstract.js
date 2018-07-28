// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot abstract <topic> - Prints a nice abstract of the given topic

// Author:
//   tantalor
module.exports = function(robot) {
  return robot.respond(/(abs|abstract) (.+)/i, function(res) {
    var abstract_url;
    abstract_url = `http://api.duckduckgo.com/?format=json&q=${encodeURIComponent(res.match[2])}`;
    return res.http(abstract_url).header('User-Agent', 'Hubot Abstract Script').get()(function(err, _, body) {
      var data, topic;
      if (err) {
        return res.send("Sorry, the tubes are broken.");
      }
      data = JSON.parse(body.toString("utf8"));
      if (!data) {
        return;
      }
      if (data.RelatedTopics && data.RelatedTopics.length) {
        topic = data.RelatedTopics[0];
      }
      if (data.AbstractText) {
        // hubot abs numerology
        // Numerology is any study of the purported mystical relationship between a count or measurement and life.
        // http://en.wikipedia.org/wiki/Numerology
        res.send(data.AbstractText);
        if (data.AbstractURL) {
          return res.send(data.AbstractURL);
        }
      } else if (topic && !/\/c\//.test(topic.FirstURL)) {
        // hubot abs astronomy
        // Astronomy is the scientific study of celestial objects.
        // http://duckduckgo.com/Astronomy
        res.send(topic.Text);
        return res.send(topic.FirstURL);
      } else if (data.Definition) {
        // hubot abs contumacious
        // contumacious definition: stubbornly disobedient.
        // http://merriam-webster.com/dictionary/contumacious
        res.send(data.Definition);
        if (data.DefinitionURL) {
          return res.send(data.DefinitionURL);
        }
      } else {
        return res.send("I don't know anything about that.");
      }
    });
  });
};
