// Description:
//   Get a fortune

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot fortune me - Displays a super true fortune

// Author:
//   mrtazz
module.exports = function(robot) {
  return robot.respond(/(fortune)( me)?/i, function(msg) {
    return msg.http('http://www.fortunefortoday.com/getfortuneonly.php').get()(function(err, res, body) {
      return msg.reply(body);
    });
  });
};
