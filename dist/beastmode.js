// Description
//   Listens for beastmode.fm track urls and returns track title and cover art

// Dependencies:
//   "jsdom": "~0.2.13"

// Configuration:
//   None

// Commands:
//   {beastmodefm-url} - Return track title and cover art

// Notes:

// Author:
//   benpink
var jquery, jsdom;

jsdom = require('jsdom');

jquery = 'http://ajax.googleapis.com/ajax/libs/jquery/2.0.2/jquery.min.js';

module.exports = function(robot) {
  return robot.hear(/beastmode.fm.*?(\/(\d+))/i, function(msg) {
    return robot.http('http://beastmode.fm/track/' + msg.match[2]).get()(function(err, res, body) {
      return jsdom.env(body, [jquery], function(errors, window) {
        var trackImg, trackTitle;
        trackImg = window.$('#track-img img').attr('src');
        trackTitle = window.$('#article-info h1').text();
        return msg.send(trackTitle + ' ' + trackImg);
      });
    });
  });
};
