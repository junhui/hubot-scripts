// Description:
//   BreweryDB API

// Dependencies:
//   None

// Configuration:
//   BREWERYDB_API_KEY

// Commands:
//   hubot beer me <beer name> - Information about a beer

// Author:
//   greggroth
module.exports = function(robot) {
  return robot.respond(/beer me (.*)/i, function(msg) {
    if (process.env.BREWERYDB_API_KEY == null) {
      msg.send("Please specify your BreweyDB API key in BREWERYDB_API_KEY");
      return;
    }
    return msg.http("http://api.brewerydb.com/v2/search").query({
      type: "beer",
      withBreweries: "Y",
      key: process.env.BREWERYDB_API_KEY,
      q: msg.match[1].replace(" ", "+")
    }).get()(function(err, res, body) {
      var beer, data, response;
      data = JSON.parse(body)['data'];
      if (data) {
        beer = data[0];
      } else {
        msg.send("No beer found");
        return;
      }
      response = beer['name'];
      if (beer['breweries'] != null) {
        response += ` (${beer['breweries'][0]['name']})`;
      }
      if (beer['style'] != null) {
        response += `\n${beer['style']['name']}`;
      }
      if (beer['abv'] != null) {
        response += `\nABV:  ${beer['abv']}%`;
      }
      if (beer['ibu'] != null) {
        response += `\nIBU:  ${beer['ibu']}`;
      }
      if (beer['description'] != null) {
        response += `\nDescription:   ${beer['description']}`;
      }
      if (beer['foodPairings'] != null) {
        response += `\nFood Pairings:   ${beer['foodPairings']}`;
      }
      return msg.send(response);
    });
  });
};
