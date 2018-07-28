// Description:
//   Integrates with join.me 

// Dependencies:
//   None

// Configuration:
//   HUBOT_JOINME_AUTHCODE

// Commands:
//   hubot joinme - Generates a new join.me 9-digit code and outputs a presenter link (download) and a participant link (to view the session)

// Author:
//   webandtech
var joinme;

module.exports = function(robot) {
  return robot.respond(/joinme$/i, function(msg) {
    return joinme(msg);
  });
};

joinme = function(msg) {
  var authCode;
  authCode = process.env.HUBOT_JOINME_AUTHCODE;
  if (authCode == null) {
    msg.send("Join.me account isn't setup. Use https://secure.join.me/API/requestAuthCode.aspx?email=EMAIL&password=PASSWORD to get your authCode.");
    msg.send("Then ensure the HUBOT_JOINME_AUTHCODE environment variable is set");
    return;
  }
  return msg.http('https://secure.join.me/API/requestCode.aspx').query({
    authcode: authCode
  }).get()(function(err, res, body) {
    var code, presenter, split, ticket, viewer;
    if (body.indexOf("OK" !== "-1")) {
      split = body.split(":");
      ticket = split[2].replace(/^\s+|\s+$/g, "").replace("#chr(13)#|#chr(9)#|\n|\r", "");
      code = split[1].split("TICKET")[0].replace(/^\s+|\s+$/g, "").replace("#chr(13)#|#chr(9)#|\n|\r", "");
      presenter = "Presenter: https://secure.join.me/download.aspx?code=" + code + "&ticket=" + ticket;
      viewer = "Viewer: http://join.me/" + code;
      msg.send(presenter);
      return msg.send(viewer);
    } else {
      return msg.send("ERROR join.me #epicfail!");
    }
  });
};
