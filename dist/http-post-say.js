// Description:
//   "Accepts POST data and broadcasts it"

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   None

// URLs:
//   POST /hubot/say
//     message = <message>
//     room = <room>
//     type = <type>

//   curl -X POST http://localhost:8080/hubot/say -d message=lala -d room='#dev'

// Author:
//   insom
//   luxflux
module.exports = function(robot) {
  return robot.router.post("/hubot/say", function(req, res) {
    var body, envelope, message, room;
    body = req.body;
    room = body.room;
    message = body.message;
    robot.logger.info(`Message '${message}' received for room ${room}`);
    envelope = robot.brain.userForId('broadcast');
    envelope.user = {};
    if (room) {
      envelope.user.room = envelope.room = room;
    }
    envelope.user.type = body.type || 'groupchat';
    if (message) {
      robot.send(envelope, message);
    }
    res.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    return res.end('Thanks\n');
  });
};
