// Description:
// Make a slogan using sloganizer.net

// Dependencies:
// None

// Configuration:
// None

// Commands:
// hubot slogan (.*)

// Author:
// DafyddCrosby

var getSlogan;

getSlogan = function(msg, query) {
  return msg.http(`http://www.sloganizer.net/en/outbound.php?slogan=${query}`).get()(function(err, res, body) {
    var slogan;
    slogan = body.replace(/<.*?>/g, "");
    if (!err) {
      return msg.send(slogan);
    }
  });
};

module.exports = function(robot) {
  return robot.hear(/slogan (.*)/i, function(msg) {
    return getSlogan(msg, msg.match[1]);
  });
};
