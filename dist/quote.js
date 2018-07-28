// Description:
//   Display a random quote or one from a specific person

// Dependencies:
//   None

// Configuration:
//   HUBOT_QUOTE_MAX_LINES

// Commands:
//   hubot enlighten - random quote
//   hubot quote - random quote
//   hubot quote from <person> - quote from person

// Author:
//   cldwalker
module.exports = function(robot) {
  return robot.respond(/enlighten|quote from (.*)|quote/i, function(msg) {
    var params;
    params = {
      max_lines: process.env.HUBOT_QUOTE_MAX_LINES || '4'
    };
    if (msg.match[1]) {
      params['source'] = msg.match[1].split(/\s+/).join('+');
    }
    return msg.http('http://www.iheartquotes.com/api/v1/random').query(params).get()(function(err, res, body) {
      body = body.replace(/\s*\[\w+\]\s*http:\/\/iheartquotes.*\s*$/m, '');
      body = body.replace(/&quot;/g, "'");
      return msg.send(body);
    });
  });
};
