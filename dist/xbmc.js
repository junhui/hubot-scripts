// Description:
//   Plays YouTube videos on XBMC

// Dependencies:
//   None

// Configuration:
//   HUBOT_XBMC_URL
//   HUBOT_XBMC_USER
//   HUBOT_XBMC_PASSWORD

// Commands:
//   hubot xbmc <youtube url> - Plays the video at <youtube url>
//   hubot where is xbmc? - Displays HUBOT_XBMC_URL

// Notes:
//   Requirements:
//   * XBMC with the YouTube plugin v3.1.0 or greater installed.
//   * Allow remote control of your XBMC via HTTP.

//   Tested with XBMC Eden. Should work with versions that have the JSON-RPC API.

// Author:
//   lucaswilric

var getYouTubeVideoIdFrom, http, playYouTube, url, xbmcPassword, xbmcRequest, xbmcStop, xbmcUri, xbmcUser;

http = require('http');

url = require('url');

xbmcUri = process.env.HUBOT_XBMC_URL;

xbmcUser = process.env.HUBOT_XBMC_USER;

xbmcPassword = process.env.HUBOT_XBMC_PASSWORD || '';

playYouTube = function(videoId, msg) {
  return xbmcRequest("Player.Open", {
    "item": {
      "file": "plugin://plugin.video.youtube/?action=play_video&videoid=" + videoId
    }
  }, msg);
};

xbmcStop = function(msg) {
  return xbmcRequest("Player.Stop", {
    "playerid": 1
  }, msg);
};

xbmcRequest = function(method, params, msg) {
  var data, req;
  if (xbmcUri == null) {
    msg.reply("I don't know where XBMC is. Please configure a URL.");
    return;
  }
  if (xbmcUser == null) {
    msg.reply("I don't have a user name to give XBMC. Please configure one.");
    return;
  }
  data = JSON.stringify({
    "jsonrpc": "2.0",
    "method": method,
    "params": params,
    "id": 1
  });
  req = msg.http(xbmcUri + 'jsonrpc').auth(xbmcUser, xbmcPassword);
  return req.post(data)(function(err, res, body) {
    if (res.statusCode === 401) {
      msg.send("XBMC is saying I'm unauthorised. Check my credentials, would you?");
    }
    if (res.statusCode === 200) {
      return msg.reply("Done.");
    }
  });
};

getYouTubeVideoIdFrom = function(videoUrl) {
  var uri;
  uri = url.parse((/^http/.test(videoUrl) ? videoUrl : 'http://' + videoUrl), true);
  if (/youtube.com$/.test(uri.host)) {
    if ((uri.query != null) && (uri.query.v != null)) {
      return uri.query.v;
    }
    if (/\/v\//.test(uri.path)) {
      return uri.path.match(/\/v\/([^\/]*)/);
    }
  }
  if (/^youtu.be$/.test(uri.host)) {
    return uri.path.replace('/', '');
  }
};

module.exports = function(robot) {
  robot.respond(/xbmc (\S*youtu\.?be\S*)/i, function(msg) {
    var videoId;
    if (/(^|\/\/)((www.)?(youtube.com)|youtu.be)\//.test(msg.match[1])) {
      videoId = getYouTubeVideoIdFrom(msg.match[1]);
      if (videoId != null) {
        playYouTube(videoId, msg);
        return;
      }
    }
    return msg.reply("That doesn't look like something I can tell XBMC to play. Sorry :(");
  });
  robot.respond(/xbmc stop/i, function(msg) {
    return xbmcStop(msg);
  });
  return robot.respond(/where('s| is) xbmc\??/i, function(msg) {
    return msg.send('XBMC is at ' + process.env.HUBOT_XBMC_URL);
  });
};
