// Description:
//   Show a random image from peopleofwalmart.com

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot walmart me - Show random Walmart image
//   hubot mart me - Show random Walmart image

// Author:
//   kevinsawicki
module.exports = function(robot) {
  return robot.respond(/(wal)?mart( me)?/i, function(msg) {
    return msg.http("http://www.peopleofwalmart.com/?random=1").get()(function(error, response) {
      return msg.http(response.headers['location']).get()(function(err, res, body) {
        var col1, match;
        col1 = body.indexOf('<div class="nest">');
        if (col1 !== -1) {
          body = body.substring(col1);
          match = body.match(/http:\/\/media.peopleofwalmart.com\/wp-content\/uploads\/\d\d\d\d\/\d\d\/.+?\.jpg/g);
          if (match) {
            return msg.send(match[0]);
          }
        }
      });
    });
  });
};
