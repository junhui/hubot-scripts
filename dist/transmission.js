
// Description:
//   Gets a list of active torrents from  Transmission, a BitTorrent client.

// Dependencies:
//   None

// Configuration:
//   HUBOT_TRANSMISSION_USER - Transmission HTTP username
//   HUBOT_TRANSMISSION_PASSWORD - Transmission HTTP password
//   HUBOT_TRANSMISSION_URL - The URL used to access Transmission remotely

// Commands:
//   hubot torrents - Get a list of open torrents
//   hubot where is transmission? - Reply with the URL Hubot is using to talk to Transmission

// Notes:
//   This script uses Transmission's HTTP interface to get the information for its 
//   responses. To enable remote access to Transmission and get the values for the 
//   settings, you can follow the Transmission documentation at 
//   https://trac.transmissionbt.com/wiki/UserDocumentation
//   There should be a section about remote access under the section for your chosen OS.

// Author:
//   lucaswilric
var getTorrents, password, url, user;

url = process.env.HUBOT_TRANSMISSION_URL;

user = process.env.HUBOT_TRANSMISSION_USER;

password = process.env.HUBOT_TRANSMISSION_PASSWORD || '';

getTorrents = function(msg, sessionId = '', recursions = 0) {
  if (recursions > 4) {
    return;
  }
  if (url == null) {
    msg.reply("I don't know where Transmission is. Please configure a URL.");
    return;
  }
  if (user == null) {
    msg.reply("I don't have a user name to give Transmission. Please configure one.");
    return;
  }
  return msg.http(url).auth(user, password).header('X-Transmission-Session-Id', sessionId).post(JSON.stringify({
    method: "torrent-get",
    arguments: {
      fields: ["id", "name", "downloadDir", "percentDone", "files", "isFinished"]
    }
  }))(function(err, res, body) {
    var i, len, response, t, torrents;
    if (res.statusCode === 409) {
      return getTorrents(msg, res.headers['x-transmission-session-id'], recursions + 1);
    } else {
      response = '';
      torrents = JSON.parse(body).arguments.torrents;
      if (torrents.length === 0) {
        msg.send("There aren't any torrents loaded right now.");
        return;
      }
      for (i = 0, len = torrents.length; i < len; i++) {
        t = torrents[i];
        response += `\n[${100 * t.percentDone}%] ${t.name}`;
      }
      return msg.send(response);
    }
  });
};

module.exports = function(robot) {
  robot.respond(/torrents/i, function(msg) {
    return getTorrents(msg);
  });
  return robot.respond(/where('s| is) transmission\??/i, function(msg) {
    return msg.send("Transmission is at " + url);
  });
};
