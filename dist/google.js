// Description:
//   Returns the URL of the first google hit for a query

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot google me <query> - Googles <query> & returns 1st result's URL

// Author:
//   searls
var googleMe;

module.exports = function(robot) {
  return robot.respond(/(google)( me)? (.*)/i, function(msg) {
    return googleMe(msg, msg.match[3], function(url) {
      return msg.send(url);
    });
  });
};

googleMe = function(msg, query, cb) {
  return msg.http('http://www.google.com/search').query({
    q: query
  }).get()(function(err, res, body) {
    var ref;
    return cb(((ref = body.match(/class="r"><a href="\/url\?q=([^"]*)(&amp;sa.*)">/)) != null ? ref[1] : void 0) || `Sorry, Google had zero results for '${query}'`);
  });
};
