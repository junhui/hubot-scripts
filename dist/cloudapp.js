// Description:
//   Allow Hubot to show what's lurking behind a CloudApp link

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   http://cl.ly/* - Detects the drop's type and displays it or prints its content if it's an image or text file respectively

// Author:
//   lmarburger
var send_drop_content;

module.exports = function(robot) {
  return robot.hear(/(https?:\/\/cl.ly\/image\/[A-Za-z0-9]+)(\/[^\/]+)?/i, function(msg) {
    var link;
    if (msg.match[2]) {
      return;
    }
    link = msg.match[1];
    return msg.http(link).headers({
      Accept: "application/json"
    }).get()(function(err, res, body) {
      var drop;
      if (res.statusCode !== 200) {
        msg.send(`No drop at ${link}! It may have been deleted.`);
        return;
      }
      drop = JSON.parse(body);
      switch (drop.item_type) {
        case 'image':
          return msg.send(drop.content_url);
        case 'text':
          return send_drop_content(msg, drop.content_url);
      }
    });
  });
};

send_drop_content = function(msg, url) {
  return msg.http(url).get()(function(err, res, body) {
    if (res.statusCode === 302) {
      // Follow the breadcrumbs of redirects.
      return send_drop_content(msg, res.headers.location);
    } else {
      if (!~body.indexOf("\n")) {
        body += "\n";
      }
      return msg.send(body);
    }
  });
};
