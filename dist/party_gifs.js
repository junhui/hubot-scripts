// Description:
//   party_gifs.coffee - Make a GIF on the fly from search terms.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot gif me <query> - Create a gif using images from the web.
//   hubot pty me <query> - Alias for 'gif'.

// Notes:
//   GIFs created by the gifs.pty.io API.
//   Images come from the Google Image API.

// Author:
//   dzello
var gifMe;

module.exports = function(robot) {
  return robot.respond(/(gif|pty)( me)? (.*)/i, function(msg) {
    return gifMe(msg, msg.match[3]);
  });
};

gifMe = function(msg, query) {
  var url;
  url = `http://gifs.pty.io/${encodeURIComponent(query)}.gif`;
  return msg.http(url).head()(function(err, res, body) {
    if (res.statusCode === 404) {
      return msg.send("Couldn't find any images.");
    } else if (err || res.statusCode > 404) {
      return msg.send("An error occurred creating that GIF.");
    } else {
      return msg.send(url);
    }
  });
};
