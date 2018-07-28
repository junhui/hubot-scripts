// Description:
//   Grab a Punchform recipe - http://punchfork.com/api

// Dependencies:
//   None

// Configuration:
//   HUBOT_PUNCHFORK_APIKEY

// Commands:
//   hubot cook <ingredent>  - Suggest recipe based on ingredent

// Author:
//   adamstrawson
module.exports = function(robot) {
  return robot.respond(/cook (.*)$/i, function(msg) {
    var api_key, keyword;
    keyword = `${msg.match[1]}/`;
    api_key = process.env.HUBOT_PUNCHFORK_APIKEY;
    return msg.http(`http://api.punchfork.com/recipes?key=${api_key}&q=${keyword}&count=1`).get()(function(err, res, body) {
      var object;
      if (res.statusCode === 404) {
        return msg.send('No recipe not found.');
      } else {
        object = JSON.parse(body);
        msg.send(object.recipes[0].title);
        return msg.send(object.recipes[0].pf_url);
      }
    });
  });
};
