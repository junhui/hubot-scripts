// Description:
//   Grabs snippets of song lyrics
//   Limited to snippets due to copyright stuff

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot lyrics for <song> by <artist> - returns snippet of lyrics for this song

// Author:
//   mportiz08
module.exports = function(robot) {
  var getLyrics;
  robot.respond(/lyrics for (.*) by (.*)/i, function(msg) {
    var artist, song;
    song = msg.match[1];
    artist = msg.match[2];
    return getLyrics(msg, song, artist);
  });
  return getLyrics = function(msg, song, artist) {
    return msg.http("http://lyrics.wikia.com/api.php").query({
      artist: artist,
      song: song,
      fmt: "json"
    }).get()(function(err, res, body) {
      var result;
      result = eval(body); // can't use JSON.parse :(
      msg.send(result['url']);
      return msg.send(result['lyrics']);
    });
  };
};
