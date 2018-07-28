// Description:
//   Retrieves random cat facts.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot catfact - Reply back with random cat fact.

// Author:
//   scottmeyer
module.exports = function(robot) {
  return robot.respond(/CATFACT$/i, function(msg) {
    return msg.http('http://catfacts-api.appspot.com/api/facts?number=1').get()(function(error, response, body) {
      // passes back the complete reponse
      response = JSON.parse(body);
      if (response.success === "true") {
        return msg.send(response.facts[0]);
      } else {
        return msg.send("Unable to get cat facts right now.");
      }
    });
  });
};
