// Description:
//   Insert Pictures of Magic: The Gathering Cards

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot cast <card name> - a picture of the named magic card

// Author:
//   djljr
var querystring;

querystring = require('querystring');

module.exports = function(robot) {
  return robot.respond(/cast (.+)/i, function(msg) {
    var card, query, url;
    url = "http://gatherer.wizards.com/Handlers/Image.ashx";
    card = msg.match[1] || "Dismal%20Failure";
    query = {
      type: "card",
      name: card
    };
    return msg.send(`${url}?${querystring.stringify(query)}#.jpg`);
  });
};
