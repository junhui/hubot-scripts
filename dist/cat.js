// Description:
//   Send messages to channels via hubot

// Dependencies:
//   None

// Configuration:
//   HUBOT_CAT_PORT

// Commands:
//   None

// Notes:
//   $ echo "#channel|hello everyone" | nc -u -w1 bot_hostname bot_port
//   $ echo "nickname|hello mister" | nc -u -w1 bot_hostname bot_port

// Author:
//   simon
var dgram, server;

dgram = require("dgram");

server = dgram.createSocket("udp4");

module.exports = function(robot) {
  server.on('message', function(message, rinfo) {
    var msg, target, user;
    msg = message.toString().trim().split("|");
    target = msg[0];
    console.log(`Sending '${msg[1]}' to '${target}'`);
    user = {
      room: target
    };
    return robot.send(user, msg[1]);
  });
  return server.bind(parseInt(process.env.HUBOT_CAT_PORT));
};
