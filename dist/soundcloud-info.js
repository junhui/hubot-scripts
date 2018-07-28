// Description
//   Show sound information when Soundcloud URLs are seen.

// Dependencies:
//   None

// Configuration:
//   HUBOT_SOUNDCLOUD_CLIENTID: API client_id for SoundCloud

// Commands:
//   None

// Notes:
//   For text-based adapters like IRC.
//   Set the environment var HUBOT_SOUNDCLOUD_CLIENTID to your SoundCloud API client_id for this to work

// Author:
//   Joe Fleming (@w33ble)
var fetchUrl, getDuration, showInfo;

module.exports = function(robot) {
  return robot.hear(/(https?:\/\/(www\.)?soundcloud\.com\/)([\d\w\-\/]+)/i, function(msg) {
    return fetchUrl(msg, msg.match[0]);
  });
};

fetchUrl = function(msg, url) {
  if (!process.env.HUBOT_SOUNDCLOUD_CLIENTID) {
    return msg.reply("HUBOT_SOUNDCLOUD_CLIENTID must be defined, see http://developers.soundcloud.com/ to get one");
  }
  return msg.http(`http://api.soundcloud.com/resolve.json?client_id=${process.env.HUBOT_SOUNDCLOUD_CLIENTID}&url=${url}`).query({
    alt: 'json'
  }).get()(function(err, res, body) {
    var data;
    if (res.statusCode === 302) {
      data = JSON.parse(body);
      return showInfo(msg, data.location);
    } else if (res.statusCode === 401) {
      return msg.reply(`SoundCloud Error: API sent ${res.statusCode}, check your HUBOT_SOUNDCLOUD_CLIENTID setting`);
    } else {
      return msg.reply(`SoundCloud Error: API resolve returned ${res.statusCode}`);
    }
  });
};

showInfo = function(msg, url) {
  return msg.http(url).query({
    alt: 'json'
  }).get()(function(err, res, body) {
    var data, ref, tracks;
    if (res.statusCode === 200) {
      data = JSON.parse(body);
      if ((ref = data.kind) === 'playlist' || ref === 'track') {
        tracks = data.track_count != null ? `${data.track_count} tracks, ` : '';
        return msg.send(`SoundCloud ${data.kind}: ${data.user.username} - ${data.title} (${tracks}${getDuration(data.duration)})`);
      }
    } else {
      return msg.reply(`SoundCloud Error: API lookup returned ${res.statusCode}`);
    }
  });
};

getDuration = function(time) {
  var h, hours, m, mins, secs;
  time = time / 1000;
  h = time / 60 / 60;
  hours = Math.floor(h);
  m = (h - hours) * 60;
  mins = Math.floor(m);
  secs = Math.round(Math.floor((m - mins) * 60));
  if (hours > 0) {
    return `${hours}h${mins}m${secs}s`;
  }
  return `${mins}m${secs}s`;
};
