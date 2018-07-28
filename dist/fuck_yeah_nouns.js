// Description
//   Grab images from "Fuck yeah nouns"

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   fuck yeah <noun> - Displays a fuck yeah image for the given noun

// Notes:
//   Uses holman/fuck-yeah as a provider. Can be altered to use the original FYN,
//   but be sure to read the caveats in the comments.

// Author:
//   iangreenleaf
var providers;

providers = {
  holman: function(noun) {
    noun = escape(noun);
    return `http://fuckyeah.herokuapp.com/${noun}#.jpg`;
  },
  // If you want the original FYN, you can use this URL instead.
  // WARNING: The results from FYN are a bit "quirky", to put it charitably.
  // Using this endpoint turned Hubot into a demented, pervy old man who
  // occasionally posted very NSFW images.
  fyn: function(noun) {
    noun = noun.replace(/\s+/g, "_");
    noun = noun.replace(/\W/g, "");
    return `http://fuckyeahnouns.com/images/${noun}.jpg`;
  }
};

module.exports = function(robot) {
  return robot.hear(/fuck yeah (.+)/i, function(msg) {
    var noun, ping, url;
    noun = msg.match[1];
    url = providers.holman(noun);
    // This is subtly different from the common usage, because I want a response
    // as soon as we have a status code, don't care about the actual body.
    ping = msg.http(url).get((e, req) => {
      return req.addListener("response", (res) => {
        if (res.statusCode !== 200) {
          return robot.logger.error(`Bad response from FYN: ${res.statusCode}`);
        } else {
          return msg.send(url);
        }
      });
    });
    return ping();
  });
};
