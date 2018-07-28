// Description:
//   Play music. At your office. Like a boss. https://github.com/play/play

// Dependencies:
//   None

// Configuration:
//   HUBOT_PLAY_URL
//   HUBOT_PLAY_TOKEN

// Commands:
//   hubot play - Plays music.
//   hubot play next - Plays the next song.
//   hubot play previous - Plays the previous song.
//   hubot what's playing - Returns the currently-played song.
//   hubot what's next - Returns next song in the queue.
//   hubot I want this song - Returns a download link for the current song.
//   hubot I want this album - Returns a download link for the current album.
//   hubot play <artist> - Queue up ten songs from a given artist.
//   hubot play <album> - Queue up an entire album.
//   hubot play <song> - Queue up a particular song. This grabs the first song by playcount.
//   hubot play <something> right [fucking] now - Play this shit right now.
//   hubot where's play - Gives you the URL to the web app.
//   hubot volume? - Returns the current volume level.
//   hubot volume [0-100] - Sets the volume.
//   hubot be quiet - Mute play.
//   hubot say <message> - `say` your message over your speakers.
//   hubot clear play - Clears the Play queue.

// Author:
//   holman
var URL, authedRequest;

URL = `${process.env.HUBOT_PLAY_URL}`;

authedRequest = function(message, path, action, options, callback) {
  return message.http(`${URL}${path}`).query({
    login: message.message.user.githubLogin,
    token: `${process.env.HUBOT_PLAY_TOKEN}`
  }).header('Content-Length', 0).query(options)[action]()(function(err, res, body) {
    return callback(err, res, body);
  });
};

module.exports = function(robot) {
  robot.respond(/where'?s play/i, function(message) {
    message.finish();
    return authedRequest(message, '/stream_url', 'get', {}, function(err, res, body) {
      return message.send(`play's at ${URL} and you can stream from ${body}`);
    });
  });
  robot.respond(/what'?s playing/i, function(message) {
    return authedRequest(message, '/now_playing', 'get', {}, function(err, res, body) {
      var json, str;
      json = JSON.parse(body);
      str = `"${json.name}" by ${json.artist}, from "${json.album}".`;
      message.send(`${URL}/images/art/${json.id}.png?login=HOTFIX#.jpg`);
      return message.send("Now playing " + str);
    });
  });
  robot.respond(/what'?s next/i, function(message) {
    return authedRequest(message, '/queue', 'get', {}, function(err, res, body) {
      var json, song;
      json = JSON.parse(body);
      song = json.songs[1];
      if (typeof song === "object") {
        return message.send(`We will play this awesome track "${song.name}" by ${song.artist} in just a minute!`);
      } else {
        return message.send("The queue is empty :( Try adding some songs, eh?");
      }
    });
  });
  robot.respond(/say (.*)/i, function(message) {
    return authedRequest(message, '/say', 'post', {
      message: message.match[1]
    }, function(err, res, body) {
      return message.send(message.match[1]);
    });
  });
  robot.respond(/play next/i, function(message) {
    message.finish();
    return authedRequest(message, '/next', 'put', {}, function(err, res, body) {
      var json;
      json = JSON.parse(body);
      return message.send(`On to the next one (which conveniently is ${json.artist}'s "${json.name}")`);
    });
  });
  
  // VOLUME

  robot.respond(/app volume\?/i, function(message) {
    message.finish();
    return authedRequest(message, '/app-volume', 'get', {}, function(err, res, body) {
      return message.send(`Yo :${message.message.user.name}:, the volume is ${body} :mega:`);
    });
  });
  robot.respond(/app volume (.*)/i, function(message) {
    var params;
    params = {
      volume: message.match[1]
    };
    return authedRequest(message, '/app-volume', 'put', params, function(err, res, body) {
      return message.send(`Bumped the volume to ${body}, :${message.message.user.name}:`);
    });
  });
  robot.respond(/volume\?/i, function(message) {
    message.finish();
    return authedRequest(message, '/system-volume', 'get', {}, function(err, res, body) {
      return message.send(`Yo :${message.message.user.name}:, the volume is ${body} :mega:`);
    });
  });
  robot.respond(/volume ([+-])?(.*)/i, function(message) {
    var multiplier, params;
    if (message.match[1]) {
      multiplier = message.match[1][0] === '+' ? 1 : -1;
      return authedRequest(message, '/system-volume', 'get', {}, function(err, res, body) {
        var newVolume, params;
        newVolume = parseInt(body) + parseInt(message.match[2]) * multiplier;
        params = {
          volume: newVolume
        };
        return authedRequest(message, '/system-volume', 'put', params, function(err, res, body) {
          return message.send(`Bumped the volume to ${body}, :${message.message.user.name}:`);
        });
      });
    } else {
      params = {
        volume: message.match[2]
      };
      return authedRequest(message, '/system-volume', 'put', params, function(err, res, body) {
        return message.send(`Bumped the volume to ${body}, :${message.message.user.name}:`);
      });
    }
  });
  robot.respond(/pause|(pause play)|(play pause)/i, function(message) {
    var params;
    message.finish();
    params = {
      volume: 0
    };
    return authedRequest(message, '/system-volume', 'put', params, function(err, res, body) {
      return message.send("The office is now quiet. (But the stream lives on!)");
    });
  });
  robot.respond(/(unpause play)|(play unpause)/i, function(message) {
    var params;
    message.finish();
    params = {
      volume: 50
    };
    return authedRequest(message, '/system-volume', 'put', params, function(err, res, body) {
      return message.send("The office is now rockin' at half-volume.");
    });
  });
  robot.respond(/start play/i, function(message) {
    message.finish();
    return authedRequest(message, '/play', 'put', {}, function(err, res, body) {
      var json;
      json = JSON.parse(body);
      return message.send("Okay! :)");
    });
  });
  robot.respond(/stop play/i, function(message) {
    message.finish();
    return authedRequest(message, '/pause', 'put', {}, function(err, res, body) {
      var json;
      json = JSON.parse(body);
      return message.send("Okay. :(");
    });
  });
  
  // STARS

  robot.respond(/I want this song/i, function(message) {
    return authedRequest(message, '/now_playing', 'get', {}, function(err, res, body) {
      var json, url;
      json = JSON.parse(body);
      url = `${URL}/song/${json.id}/download`;
      return message.send(`Pretty rad, innit? Grab it for yourself: ${url}`);
    });
  });
  robot.respond(/I want this album/i, function(message) {
    return authedRequest(message, '/now_playing', 'get', {}, function(err, res, body) {
      var json, url;
      json = JSON.parse(body);
      url = `${URL}/artist/${escape(json.artist)}/album/${escape(json.album)}/download`;
      return message.send(`you fucking stealer: ${url}`);
    });
  });
  robot.respond(/(play something i('d)? like)|(play the good shit)/i, function(message) {
    message.finish();
    return authedRequest(message, '/queue/stars', 'post', {}, function(err, res, body) {
      var json, str;
      json = JSON.parse(body);
      str = json.songs.map(function(song) {
        return `"${song.name} by ${song.artist}"`;
      });
      str.join(', ');
      return message.send(`NOW HEAR THIS: You will soon listen to ${str}`);
    });
  });
  robot.respond(/I (like|star|love|dig) this( song)?/i, function(message) {
    return authedRequest(message, '/now_playing', 'post', {}, function(err, res, body) {
      var json;
      json = JSON.parse(body);
      return message.send("It's certainly not a pedestrian song, is it. I'll make a " + `note that you like ${json.artist}'s "${json.name}".`);
    });
  });
  
  // PLAYING

  robot.respond(/play (.*)/i, function(message) {
    var params;
    params = {
      subject: message.match[1]
    };
    return authedRequest(message, '/freeform', 'post', params, function(err, res, body) {
      var json, str;
      if (body.length === 0) {
        return message.send("That doesn't exist in Play. Or anywhere, probably. If it's not" + " in Play the shit don't exist. I'm a total hipster.");
      }
      json = JSON.parse(body);
      str = json.songs.map(function(song) {
        return `"${song.name}" by ${song.artist}`;
      });
      str.join(', ');
      return message.send(`Queued up ${str}`);
    });
  });
  robot.respond(/clear play/i, function(message) {
    return authedRequest(message, '/queue/all', 'delete', {}, function(err, res, body) {
      return message.send(":fire: :bomb:");
    });
  });
  robot.respond(/spin (it|that shit)/i, function(message) {
    return authedRequest(message, '/dj', 'post', {}, function(err, res, body) {
      return message.send(":mega: :cd: :dvd: :cd: :dvd: :cd: :dvd: :speaker:");
    });
  });
  return robot.respond(/stop (spinning|dj)/i, function(message) {
    return authedRequest(message, '/dj', 'delete', {
      note: `github-dj-${message.message.user.githubLogin}`
    }, function(err, res, body) {
      return message.send(`Nice work. You really did a great job. Your session has been saved and added to Play as: ${body}`);
    });
  });
};
