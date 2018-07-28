// Description:
//   Metadata lookup for spotify links

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   <spotify link> - returns info about the link (track, artist, etc.)

// Author:
//   jacobk
var spotify;

module.exports = function(robot) {
  return robot.hear(spotify.link, function(msg) {
    return msg.http(spotify.uri(msg.match[0])).get()(function(err, res, body) {
      var data;
      if (res.statusCode === 200) {
        data = JSON.parse(body);
        return msg.send(spotify[data.info.type](data));
      }
    });
  });
};

spotify = {
  link: /(?:(http|https):\/\/(open|play).spotify.com\/(track|album|artist)\/|spotify:(track|album|artist):)\S+/,
  uri: function(link) {
    return `http://ws.spotify.com/lookup/1/.json?uri=${link}`;
  },
  track: function(data) {
    var album, track;
    track = `${data.track.artists[0].name} - ${data.track.name}`;
    album = `(${data.track.album.name}) (${data.track.album.released})`;
    return `Track: ${track} ${album}`;
  },
  album: function(data) {
    return `Album: ${data.album.artist} - ${data.album.name} (${data.album.released})`;
  },
  artist: function(data) {
    return `Artist: ${data.artist.name}`;
  }
};
