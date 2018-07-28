// Description:
//   Control Spot from campfire. https://github.com/minton/spot

// Dependencies:
//   None

// Configuration:
//   HUBOT_SPOT_URL

// Commands:
//   hubot play! - Plays current playlist or song.
//   hubot pause - Pause the music.
//   hubot play next - Plays the next song.
//   hubot play back - Plays the previous song.
//   hubot playing? - Returns the currently-played song.
//   hubot play <song> - Play a particular song. This plays the first most popular result.
//   hubot volume? - Returns the current volume level.
//   hubot volume [0-100] - Sets the volume.
//   hubot volume+ - Bumps the volume.
//   hubot volume- - Bumps the volume down.
//   hubot mute - Sets the volume to 0.
//   hubot [name here] says turn it down - Sets the volume to 15 and blames [name here].
//   hubot say <message> - Tells hubot to read a message aloud.
//   hubot find <song> - See if Spotify knows about a song without attempting to play it.
//   hubot airplay <Apple TV> - Tell Spot to broadcast to the specified Apple TV.
//   hubot spot - Start or restart the Spotify client.

// Author:
//   mcminton
var URL, spotRequest;

URL = `${process.env.HUBOT_SPOT_URL}`;

spotRequest = function(message, path, action, options, callback) {
  return message.http(`${URL}${path}`).query(options)[action]()(function(err, res, body) {
    return callback(err, res, body);
  });
};

module.exports = function(robot) {
  robot.respond(/play!/i, function(message) {
    message.finish();
    return spotRequest(message, '/play', 'put', {}, function(err, res, body) {
      return message.send(`:notes:  ${body}`);
    });
  });
  robot.respond(/pause/i, function(message) {
    var params;
    params = {
      volume: 0
    };
    return spotRequest(message, '/pause', 'put', params, function(err, res, body) {
      return message.send(`${body} :cry:`);
    });
  });
  robot.respond(/next/i, function(message) {
    return spotRequest(message, '/next', 'put', {}, function(err, res, body) {
      return message.send(`${body} :fast_forward:`);
    });
  });
  robot.respond(/back/i, function(message) {
    return spotRequest(message, '/back', 'put', {}, function(err, res, body) {
      return message.send(`${body} :rewind:`);
    });
  });
  robot.respond(/playing\?/i, function(message) {
    return spotRequest(message, '/playing', 'get', {}, function(err, res, body) {
      message.send(`${URL}/playing.png`);
      return message.send(`:notes:  ${body}`);
    });
  });
  robot.respond(/volume\?/i, function(message) {
    return spotRequest(message, '/volume', 'get', {}, function(err, res, body) {
      return message.send(`Spot volume is ${body}. :mega:`);
    });
  });
  robot.respond(/volume\+/i, function(message) {
    return spotRequest(message, '/bumpup', 'put', {}, function(err, res, body) {
      return message.send(`Spot volume bumped to ${body}. :mega:`);
    });
  });
  robot.respond(/volume\-/i, function(message) {
    return spotRequest(message, '/bumpdown', 'put', {}, function(err, res, body) {
      return message.send(`Spot volume bumped down to ${body}. :mega:`);
    });
  });
  robot.respond(/mute/i, function(message) {
    return spotRequest(message, '/mute', 'put', {}, function(err, res, body) {
      return message.send(`${body} :mute:`);
    });
  });
  robot.respond(/volume (.*)/i, function(message) {
    var params;
    params = {
      volume: message.match[1]
    };
    return spotRequest(message, '/volume', 'put', params, function(err, res, body) {
      return message.send(`Spot volume set to ${body}. :mega:`);
    });
  });
  robot.respond(/play (.*)/i, function(message) {
    var params;
    params = {
      q: message.match[1]
    };
    return spotRequest(message, '/find', 'post', params, function(err, res, body) {
      return message.send(`:small_blue_diamond: ${body}`);
    });
  });
  robot.respond(/say (.*)/i, function(message) {
    var params, what;
    what = message.match[1];
    params = {
      what: what
    };
    return spotRequest(message, '/say', 'put', params, function(err, res, body) {
      return message.send(what);
    });
  });
  robot.respond(/(.*) says.*turn.*down.*/i, function(message) {
    var name, params;
    name = message.match[1];
    message.send(`${name} says, 'Turn down the music and get off my lawn!' :bowtie:`);
    params = {
      volume: 15
    };
    return spotRequest(message, '/volume', 'put', params, function(err, res, body) {
      return message.send(`Spot volume set to ${body}. :mega:`);
    });
  });
  robot.respond(/find (.*)/i, function(message) {
    var params, search;
    search = message.match[1];
    params = {
      q: search
    };
    return spotRequest(message, '/just-find', 'post', params, function(err, res, body) {
      return message.send(body);
    });
  });
  robot.respond(/airplay (.*)/i, function(message) {
    var params;
    params = {
      atv: message.match[1]
    };
    return spotRequest(message, '/airplay', 'put', params, function(err, res, body) {
      return message.send(`${body} :mega:`);
    });
  });
  return robot.respond(/spot/i, function(message) {
    return spotRequest(message, '/spot', 'put', {}, function(err, res, body) {
      return message.send(body);
    });
  });
};
