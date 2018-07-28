// Description:
//   An HTTP Listener that notifies about new Github pull requests

// Dependencies:
//   "url": ""
//   "querystring": ""

// Configuration:
//   You will have to do the following:
//   1. Get an API token: curl -u 'username' -d '{"scopes":["repo"],"note":"Hooks management"}' \
//                         https://api.github.com/authorizations
//   2. Add <HUBOT_URL>:<PORT>/hubot/gh-pull-requests?room=<room>[&type=<type>] url hook via API:
//      curl -H "Authorization: token <your api token>" \
//      -d '{"name":"web","active":true,"events":["pull_request"],"config":{"url":"<this script url>","content_type":"json"}}' \
//      https://api.github.com/repos/<your user>/<your repo>/hooks

// Commands:
//   None

// URLS:
//   POST /hubot/gh-pull-requests?room=<room>[&type=<type]

// Authors:
//   spajus

// Notes:
//   Room information can be obtained by hubot-script: room-info.coffee
//   Room must be in url encoded format (i.e. encodeURIComponent("yourRoomInfo"))
var announcePullRequest, querystring, url;

url = require('url');

querystring = require('querystring');

module.exports = function(robot) {
  return robot.router.post("/hubot/gh-pull-requests", function(req, res) {
    var data, error, query, room;
    query = querystring.parse(url.parse(req.url).query);
    data = req.body;
    room = query.room;
    try {
      announcePullRequest(data, function(what) {
        return robot.messageRoom(room, what);
      });
    } catch (error1) {
      error = error1;
      robot.messageRoom(room, `Whoa, I got an error: ${error}`);
      console.log(`github pull request notifier error: ${error}. Request: ${req.body}`);
    }
    return res.end("");
  });
};

announcePullRequest = function(data, cb) {
  var mentioned, mentioned_line, ref, unique;
  if (data.action === 'opened') {
    mentioned = (ref = data.pull_request.body) != null ? ref.match(/(^|\s)(@[\w\-\/]+)/g) : void 0;
    if (mentioned) {
      unique = function(array) {
        var i, key, output, ref1, results, value;
        output = {};
        for (key = i = 0, ref1 = array.length; (0 <= ref1 ? i < ref1 : i > ref1); key = 0 <= ref1 ? ++i : --i) {
          output[array[key]] = array[key];
        }
        results = [];
        for (key in output) {
          value = output[key];
          results.push(value);
        }
        return results;
      };
      mentioned = mentioned.filter(function(nick) {
        var slashes;
        slashes = nick.match(/\//g);
        return slashes === null || slashes.length < 2;
      });
      mentioned = mentioned.map(function(nick) {
        return nick.trim();
      });
      mentioned = unique(mentioned);
      mentioned_line = `\nMentioned: ${mentioned.join(", ")}`;
    } else {
      mentioned_line = '';
    }
    return cb(`New pull request "${data.pull_request.title}" by ${data.pull_request.user.login}: ${data.pull_request.html_url}${mentioned_line}`);
  }
};
