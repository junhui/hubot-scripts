// Description:
//   Post pulp (pulpproject.org) related events using pulp event listner

// Dependencies:
//   "url" : ""
//   "querystring" : ""

// Configuration:
//   PULP_CHANNEL
//   PULP_DEBUG

//   Put http://<HUBOT_URL>:<PORT>/pulp/report as your event listner
//   You can also append "?target=#room1,#room2" to the URL to control the
//   message destination.

// Commands:
//   None

// URL:
//   /pulp/report

// Author:
//   lsjostro
var querystring, url;

url = require('url');

querystring = require('querystring');

module.exports = function(robot) {
  var bold, channel, debug, handler, underline;
  channel = process.env.PULP_CHANNEL || "#announce";
  debug = process.env.PULP_DEBUG != null;
  if (robot.adapter.constructor.name === 'IrcBot') {
    bold = function(text) {
      return "\x02" + text + "\x02";
    };
    underline = function(text) {
      return "\x1f" + text + "\x1f";
    };
  } else {
    bold = function(text) {
      return text;
    };
    underline = function(text) {
      return text;
    };
  }
  handler = function(req, res) {
    var data, query, user;
    query = querystring.parse(url.parse(req.url).query);
    data = req.body;
    if (debug) {
      console.log('query', query);
      console.log('data', data);
    }
    user = {};
    user.room = query.targets ? channel + ',' + query.targets : channel;
    if (query.type) {
      user.type = query.type;
    }
    switch (data.event_type) {
      case "repo.sync.start":
        return robot.send(user, `Pulp started repo sync for ${bold(data.payload.repo_id)}`);
      case "repo.sync.finish":
        switch (data.payload.result) {
          case "success":
            return robot.send(user, `Yay! ${bold(data.payload.repo_id)} successfully finished! (${bold(data.payload.summary.packages.num_synced_new_rpms)} new packages)`);
          case "failed":
            return robot.send(user, `Oh no! ${bold(data.payload.repo_id)} failed! (please check /var/log/pulp/pulp.log for details)`);
        }
    }
  };
  return robot.router.post("/pulp/report", function(req, res) {
    handler(req, res);
    return res.end("");
  });
};
