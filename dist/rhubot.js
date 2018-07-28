// Description: 
//   Teach Hubot to play nice with Ruby via rhubot (https://github.com/minton/rhubot)

// Dependencies:
//   None

// Configuration:
//   RHUBOT_PATH - Path to Rhubot
//   HUBOT_URL - URL to Hubot HTTP router - http://192.168.0.0:8080

// Commands:
//   rb <cmd> <args> - Runs a Ruby script named <cmd> sending the arguments <args>.

// Author:
//   @mcminton
var httpUrl, routerPost, scriptPath, sh;

sh = require('sh');

scriptPath = process.env.RHUBOT_SCRIPT_PATH;

routerPost = "/hubot/rhubot";

httpUrl = process.env.HUBOT_URL + routerPost;

module.exports = function(robot) {
  robot.hear(/rb\s{1}([^\s]+)\s{1}(.+)/i, function(msg) {
    var data, me, proc, script, scriptArgs, spawn;
    script = msg.match[1];
    scriptArgs = msg.match[2];
    console.log(`Running ${script} ${scriptArgs}`);
    data = '';
    spawn = require('child_process').spawn;
    proc = spawn("ruby", [`${scriptPath}/rhubot.rb`, httpUrl, msg.message.user.room, script, scriptArgs]);
    me = this;
    proc.stdout.on('data', function(chunk) {
      return data += chunk.toString();
    });
    proc.stderr.on('data', function(chunk) {
      return msg.send(chunk.toString());
    });
    return proc.stdout.on('end', function() {
      return msg.send(data.toString());
    });
  });
  return robot.router.post(routerPost, function(req, res) {
    var result, user;
    user = robot.brain.userForId('broadcast');
    user.room = req.body.room;
    user.type = 'groupchat';
    result = req.body.result;
    robot.send(user, `${result}`);
    return res.end("O.o");
  });
};
