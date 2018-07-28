// Description
//   Show video metadata when YouTube URLs are seen.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   [YouTube video URL] - shows title and time length for the URL

// Notes:
//   For text-based adapters like IRC.

// Author:
//   mmb
var formatTime, humanizeNumber, querystring, showInfo, url;

querystring = require('querystring');

url = require('url');

module.exports = function(robot) {
  robot.hear(/(https?:\/\/www\.youtube\.com\/watch\?.+?)(?:\s|$)/i, function(msg) {
    var query_parsed, url_parsed, video_hash;
    url_parsed = url.parse(msg.match[1]);
    query_parsed = querystring.parse(url_parsed.query);
    if (query_parsed.v) {
      video_hash = query_parsed.v;
      return showInfo(msg, video_hash);
    }
  });
  return robot.hear(/(https?:\/\/youtu\.be\/)([a-z0-9\-_]+)/i, function(msg) {
    var video_hash;
    video_hash = msg.match[2];
    return showInfo(msg, video_hash);
  });
};

showInfo = function(msg, video_hash) {
  return msg.http(`http://gdata.youtube.com/feeds/api/videos/${video_hash}`).query({
    alt: 'json'
  }).get()(function(err, res, body) {
    var data, entry, r, thumbs_down, thumbs_up;
    if (res.statusCode === 200) {
      data = JSON.parse(body);
      entry = data.entry;
      r = entry.gd$rating;
      thumbs_up = Math.round(((r.average - r.min) / (r.max - r.min)) * r.numRaters);
      thumbs_down = r.numRaters - thumbs_up;
      return msg.send(`YouTube: ${entry.title.$t} (${formatTime(entry.media$group.yt$duration.seconds)}, ${humanizeNumber(entry.yt$statistics.viewCount)} views, ${humanizeNumber(thumbs_up)} thumbs up, ${humanizeNumber(thumbs_down)} thumbs down)`);
    } else {
      return msg.send(`YouTube: error: ${video_hash} returned ${res.statusCode}: ${body}`);
    }
  });
};

formatTime = function(seconds) {
  var min, result, sec;
  min = Math.floor(seconds / 60);
  sec = seconds % 60;
  result = '';
  if (min > 0) {
    result += `${min}m`;
  }
  if (sec > 0) {
    result += `${sec}s`;
  }
  return result;
};

humanizeNumber = function(n) {
  var n2;
  n = n.toString();
  while (true) {
    n2 = n.replace(/(\d)(\d{3})($|,)/g, '$1,$2$3');
    if (n === n2) {
      break;
    }
    n = n2;
  }
  return n;
};
