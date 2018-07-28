
// Description:
//   Hubble Movie information is displayed.

// Dependencies:
//   None

// Commands:
//   hubble me <query>  - Movie information is displayed 
//   hub me <query>

// Author:
//   cobaimelan
var getMovie;

getMovie = function(msg) {
  var query;
  query = msg.match[3];
  return msg.http('http://hububble.herokuapp.com/movie/?').query({
    q: query
  }).get()(function(err, res, body) {
    var results;
    results = JSON.parse(body);
    if (results.eror) {
      msg.send("eror");
      return;
    }
    msg.send(`Movie title : ${results.title}`);
    msg.send(`Movie year : ${results.year}`);
    msg.send(`Movie artist : ${results.artist}`);
    return msg.send(`Movie description  : ${results.desc}`);
  });
};

module.exports = function(robot) {
  return robot.respond(/(hubble|hub)( me)? (.*)/i, function(msg) {
    return getMovie(msg);
  });
};
