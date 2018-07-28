// Description:
//   Returns title and description when links are posted

// Dependencies:
//   "jsdom": "0.8.10"
//   "underscore": "1.3.3"

// Configuration:
//   HUBOT_HTTP_INFO_IGNORE_URLS - RegEx used to exclude Urls
//   HUBOT_HTTP_INFO_IGNORE_USERS - Comma-separated list of users to ignore
//   HUBOT_HTTP_INFO_IGNORE_DESC - Optional boolean indicating whether a site's meta description should be ignored

// Commands:
//   http(s)://<site> - prints the title and meta description for sites linked.

// Author:
//   ajacksified
var _, jsdom;

jsdom = require('jsdom');

_ = require('underscore');

module.exports = function(robot) {
  var ignoredusers;
  ignoredusers = [];
  if (process.env.HUBOT_HTTP_INFO_IGNORE_USERS != null) {
    ignoredusers = process.env.HUBOT_HTTP_INFO_IGNORE_USERS.split(',');
  }
  return robot.hear(/(http(?:s?):\/\/(\S*))/i, function(msg) {
    var done, ignore, ignorePattern, jquery, url, username, versionCompare;
    url = msg.match[1];
    username = msg.message.user.name;
    if (_.some(ignoredusers, function(user) {
      return user === username;
    })) {
      console.log('ignoring user due to blacklist:', username);
      return;
    }
    // filter out some common files from trying
    ignore = url.match(/\.(png|jpg|jpeg|gif|txt|zip|tar\.bz|js|css)/);
    ignorePattern = process.env.HUBOT_HTTP_INFO_IGNORE_URLS;
    if (!ignore && ignorePattern) {
      ignore = url.match(ignorePattern);
    }
    jquery = 'http://code.jquery.com/jquery-1.9.1.min.js';
    done = function(errors, window) {
      var $, description, ref, ref1, ref2, ref3, title;
      if (!errors) {
        $ = window.$;
        title = $('head title').text().replace(/(\r\n|\n|\r)/gm, '').replace(/\s{2,}/g, ' ').trim();
        description = ((ref = $('head meta[name=description]')) != null ? (ref1 = ref.attr('content')) != null ? (ref2 = ref1.replace(/(\r\n|\n|\r)/gm, '')) != null ? (ref3 = ref2.replace(/\s{2,}/g, ' ')) != null ? ref3.trim() : void 0 : void 0 : void 0 : void 0) || '';
        if (title && description && !process.env.HUBOT_HTTP_INFO_IGNORE_DESC) {
          return msg.send(`${title}\n${description}`);
        } else if (title) {
          return msg.send(`${title}`);
        }
      }
    };
    versionCompare = function(v1, v2, comparison) {
      var i, j, len, v1parts, v2parts, value1, value2;
      v1parts = v1.split('.');
      v2parts = v2.split('.');
      for (i = j = 0, len = v1parts.length; j < len; i = ++j) {
        value1 = v1parts[i];
        value1 = parseInt(value1, 10);
        value2 = parseInt(v2parts[i], 10);
        if (comparison === '<' && value1 < value2) {
          return 1;
        }
        if (comparison === '>' && value1 > value2) {
          return 1;
        }
      }
      return 0;
    };
    if (!ignore) {
      if (versionCompare(jsdom.version, '0.7.0', '<')) {
        return jsdom.env({
          html: url,
          scripts: [jquery],
          done: done
        });
      } else {
        return jsdom.env({
          url: url,
          scripts: [jquery],
          done: done
        });
      }
    }
  });
};
