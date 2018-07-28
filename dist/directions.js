// Description:
//   Get directions between two locations

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot get directions "<origin>" "<destination>" -- Shows directions between these locations

// Author:
//   sleekslush
var parse_directions;

parse_directions = function(body) {
  var directions, final_directions, first_route, i, leg, len, ref;
  directions = JSON.parse(body);
  first_route = directions.routes[0];
  if (!first_route) {
    return "Sorry, boss. Couldn't find directions";
  }
  final_directions = [];
  ref = first_route.legs;
  for (i = 0, len = ref.length; i < len; i++) {
    leg = ref[i];
    (function(leg) {
      var j, len1, ref1, results, step;
      final_directions.push("From: " + leg.start_address);
      final_directions.push("To:   " + leg.end_address);
      ref1 = leg.steps;
      results = [];
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        step = ref1[j];
        results.push((function(step) {
          var instructions;
          instructions = step.html_instructions.replace(/<[^>]+>/g, '');
          return final_directions.push(instructions + ` (${step.distance.text})`);
        })(step));
      }
      return results;
    })(leg);
  }
  return final_directions.join("\n");
};

module.exports = function(robot) {
  return robot.respond(/(get )?directions "((?:[^\\"]+|\\.)*)" "((?:[^\\"]+|\\.)*)"$/i, function(msg) {
    var destination, origin;
    [origin, destination] = msg.match.slice(2, 4);
    return msg.http("http://maps.googleapis.com/maps/api/directions/json").query({
      origin: origin,
      destination: destination,
      sensor: false
    }).get()(function(err, res, body) {
      return msg.send(parse_directions(body));
    });
  });
};
