// Description:
//   Listens for "good" but with 3 or more "o"s

// Dependencies:
//   None

// Configuration:
//   None

// Commnads:
//   gooo+d

// Author:
//   tbwIII
var darths;

darths = ["http://images4.wikia.nocookie.net/__cb20080808031313/starwars/images/thumb/d/d4/Palpycropped.jpg/250px-Palpycropped.jpg", "http://www.vamortgagecenter.com/blog/wp-content/uploads/2011/07/sidious.jpg", "http://torwars.com/wp-content/uploads/2011/10/darth-sidious.jpg"];

module.exports = function(robot) {
  return robot.hear(/gooo+d/i, function(msg) {
    return msg.send(msg.random(darths));
  });
};
