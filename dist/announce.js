// Description:
//   Send messages to all chat rooms.

// Dependencies:
//   None

// Configuration:
//   HUBOT_ANNOUNCE_ROOMS - comma-separated list of rooms

// Commands:
//   hubot announce "<message>" - Sends a message to all hubot rooms.
//   hubot announce downtime for "<service>" starting <timeframe> - Syntactic sugar for announcing downtime commencement
//   hubot announce downtime complete for "<service>" - Syntactic sugar for announcing downtime completion

// Author:
//   Morgan Delagrange

// URLS:
//   /broadcast/create - Send a message to designated, comma-separated rooms.
module.exports = function(robot) {
  var allRooms;
  if (process.env.HUBOT_ANNOUNCE_ROOMS) {
    allRooms = process.env.HUBOT_ANNOUNCE_ROOMS.split(',');
  } else {
    allRooms = [];
  }
  robot.respond(/announce "(.*)"/i, function(msg) {
    var announcement, i, len, results, room;
    announcement = msg.match[1];
    results = [];
    for (i = 0, len = allRooms.length; i < len; i++) {
      room = allRooms[i];
      results.push(robot.messageRoom(room, announcement));
    }
    return results;
  });
  robot.respond(/announce downtime for "(.*)" starting (.*)/i, function(msg) {
    var i, len, message, room, service, startTime, user;
    user = msg.message.user;
    service = msg.match[1];
    startTime = msg.match[2];
    message = [`The '${service}' service will be going down for maintenance starting ${startTime}.`, `If you have questions about this maintenance, please talk to ${user.name} in the ${user.room} room.  Thank you for your patience.`];
    for (i = 0, len = allRooms.length; i < len; i++) {
      room = allRooms[i];
      robot.messageRoom(room, ...message);
    }
    return msg.reply("Don't forget to pause monitoring for this service.");
  });
  robot.respond(/announce downtime complete for "(.*)"/i, function(msg) {
    var i, len, room, service;
    service = msg.match[1];
    for (i = 0, len = allRooms.length; i < len; i++) {
      room = allRooms[i];
      robot.messageRoom(room, `Maintenance for the '${service}' service is complete.`);
    }
    return msg.reply("Don't forget to resume monitoring for this service.");
  });
  return robot.router.post("/broadcast/create", function(req, res) {
    var i, len, room, rooms;
    if (req.body.rooms) {
      rooms = req.body.rooms.split(',');
    } else {
      rooms = allRooms;
    }
    for (i = 0, len = rooms.length; i < len; i++) {
      room = rooms[i];
      robot.messageRoom(room, req.body.message);
    }
    return res.end("Message Sent");
  });
};
