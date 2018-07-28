// Description:
//   Search for a job and profit!

// Dependencies:
//   None

// Configuration:
//   HUBOT_AUTHENTIC_JOBS_API_KEY

// Commands:
//   hubot find me a <technology> job in <location>

// Author:
//   sleekslush
var get_a_job;

module.exports = function(robot) {
  return robot.respond(/find me a (.* )?job( in (.+))?/i, function(msg) {
    var keywords, location, params;
    [keywords, location] = [msg.match[1], msg.match[3]];
    params = {
      api_key: process.env.HUBOT_AUTHENTIC_JOBS_API_KEY,
      method: "aj.jobs.search",
      perpage: 100,
      format: "json"
    };
    if (keywords != null) {
      params.keywords = keywords;
    }
    if (location != null) {
      params.location = location;
    }
    return msg.http("http://www.authenticjobs.com/api/").query(params).get()(function(err, res, body) {
      var response;
      response = JSON.parse(body);
      return msg.send(get_a_job(msg, response));
    });
  });
};

get_a_job = function(msg, response) {
  var listings, random_listing;
  listings = response.listings.listing;
  if (!listings.length) {
    return "Sorry, I couldn't find you a job. Guess you're going to be broke for a while!";
  }
  random_listing = msg.random(listings);
  return `${random_listing.title} at ${random_listing.company.name}. Apply at ${random_listing.apply_url || random_listing.apply_email}`;
};
