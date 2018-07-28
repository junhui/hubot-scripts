// Description:
//	 Deep thoght generator

// Dependencies:
//	None

// Configuration:
//   None

// Commands:
//	 hubot thought - Get a random deep thought.

// Notes:
//	 None

// Author:
//	 @commadelimited

// Configures the plugin
module.exports = function(robot) {
  // waits for the string "hubot deep" to occur
  return robot.respond(/thought/i, function(msg) {
    // Configures the url of a remote server
    // and makes an http get call
    return msg.http('http://andymatthews.net/thought/').get()(function(error, response, body) {
      var results;
      results = JSON.parse(body);
      // passes back the complete reponse
      return msg.send(results.thought);
    });
  });
};
