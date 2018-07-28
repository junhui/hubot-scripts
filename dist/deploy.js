// Description:
//  Deployment information to your room

// Dependencies:
//   "querystring": "0.1.0"

// Configuration:
//   HUBOT_DEPLOY_ROOM - room to send announcements to

// Commands:
//   None

// URLs:
//   GET /hubot/deploy?environment=<environment>&project=<project>[&version=<version>]
//   GET /hubot/deploy?hosts=<hosts>&wars=<wars>[&version=<version>]

//   wars is a comma seperated list
//   hosts can also be comma seperated

// Authors:
//   jslagle

// Roughly based on http-say by ajacksified
var qs;

qs = require('querystring');

module.exports = function(robot) {
  robot.router.get("/hubot/deploy", function(req, res) {
    var environment, message, project, query, ref, user, version;
    query = qs.parse(req._parsedUrl.query);
    environment = query.environment;
    project = query.project;
    if (query.version) {
      version = query.version;
    }
    user = {};
    user.room = process.env.HUBOT_DEPLOY_ROOM;
    message = "DEPLOY: " + project + " was deployed to " + environment;
    if (version) {
      message += " version " + version;
    }
    robot.send(user, message);
    if (((ref = robot.adapter.bot) != null ? ref.Room : void 0) != null) {
      robot.adapter.bot.Room(user.room).sound("trombone", (err, data) => {
        if (err) {
          return console.log(`campfire error: ${err}`);
        }
      });
    }
    return res.end("Deploy sent");
  });
  return robot.router.get("/hubot/deployhost", function(req, res) {
    var host, hosta, hosts, i, j, len, len1, message, query, ref, user, version, war, wara, wars;
    query = qs.parse(req._parsedUrl.query);
    hosts = query.hosts;
    wars = query.wars;
    if (query.version) {
      version = query.version;
    }
    user = {};
    user.room = process.env.HUBOT_DEPLOY_ROOM;
    user.type = "PasteMessage";
    hosta = hosts.split(",");
    wara = wars.split(",");
    if ((hosta.length === (ref = wara.length) && ref === 1)) {
      message = "DEPLOY: " + wars + " deployed to " + host;
      if (version) {
        message += " version " + version;
      }
    } else {
      message = "DEPLOY:\n";
      message += " WARS:\n";
      for (i = 0, len = wara.length; i < len; i++) {
        war = wara[i];
        message += "  " + war + "\n";
      }
      message += " HOSTS:\n";
      for (j = 0, len1 = hosta.length; j < len1; j++) {
        host = hosta[j];
        message += "  " + host + "\n";
      }
      if (version) {
        message += " VERSION: " + version;
      }
    }
    robot.send(user, message);
    if (robot.adapter.bot != null) {
      robot.adapter.bot.Room(user.room).sound("ohyeah", (err, data) => {
        if (err) {
          return console.log(`campfire error: ${err}`);
        }
      });
    }
    return res.end("Deploy sent");
  });
};
