// Description:
//   With the Yelp API v2.0, search for nearby restaurants.

// Dependencies:
//   "yelp": "0.1.1"

// Configuration:
//   HUBOT_YELP_CONSUMER_KEY
//   HUBOT_YELP_CONSUMER_SECRET
//   HUBOT_YELP_TOKEN
//   HUBOT_YELP_TOKEN_SECRET
//   HUBOT_YELP_SEARCH_ADDRESS
//   HUBOT_YELP_SEARCH_RADIUS
//   HUBOT_YELP_SORT
//   HUBOT_YELP_DEFAULT_SUGGESTION

//   Get your Yelp tokens at http://www.yelp.com/developers/getting_started/api_access
//   The search address can be a full address, city, or zipcode
//   The search radius should be specified in meters, it defaults to 600.
//   The sort parameter can be best matched (0 - default), distance (1) or highest rated (2).
//   See http://www.yelp.com/developers/documentation/v2/search_api#searchGP for
//   more information about the search radius and sort.

// Commands:
//   hubot what's (to eat)? for <query> near <place>?
//   hubot what's (to eat)? for <query>?
//   hubot where should (I|we|<person>) (eat|go for) <query> near <place>?
//   hubot where should (I|we|<person>) (eat|go for) <query>?
//   hubot yelp me <query> (near <place>)?

// Examples:
//   hubot what's for lunch near Palo Alto
//   hubot what's to eat for lunch
//   hubot where should chris eat steak?
//   hubot where should I go for thai near Palo Alto?
//   hubot where should we eat
//   hubot yelp me thai near Palo Alto

// Author:
//   Chris Streeter (streeter)

var consumer_key, consumer_secret, default_suggestion, lunchMe, radius, sort, start_address, token, token_secret, trim_re, yelp;

consumer_key = process.env.HUBOT_YELP_CONSUMER_KEY;

consumer_secret = process.env.HUBOT_YELP_CONSUMER_SECRET;

token = process.env.HUBOT_YELP_TOKEN;

token_secret = process.env.HUBOT_YELP_TOKEN_SECRET;

// Default search parameters
start_address = process.env.HUBOT_YELP_SEARCH_ADDRESS || "Palo Alto";

radius = process.env.HUBOT_YELP_SEARCH_RADIUS || 600;

sort = process.env.HUBOT_YELP_SORT || 0;

default_suggestion = process.env.HUBOT_YELP_DEFAULT_SUGGESTION || "Chipotle";

trim_re = /^\s+|\s+$|[\.!\?]+$/g;

// Create the API client
yelp = require("yelp").createClient({
  consumer_key: consumer_key,
  consumer_secret: consumer_secret,
  token: token,
  token_secret: token_secret
});

lunchMe = function(msg, query, random = true) {
  var location, split;
  if (typeof query === "undefined") {
    // Clean up the query
    query = "food";
  }
  query = query.replace(trim_re, '');
  if (query === "") {
    query = "food";
  }
  // Extract a location from the query
  split = query.split(/\snear\s/i);
  query = split[0];
  location = split[1];
  if (typeof location === "undefined" || location === "") {
    location = start_address;
  }
  // Perform the search
  //msg.send("Looking for #{query} around #{location}...")
  return yelp.search({
    category_filter: "restaurants",
    term: query,
    radius_filter: radius,
    sort: sort,
    limit: 20,
    location: location
  }, function(error, data) {
    var business;
    if (error !== null) {
      return msg.send(`There was an error searching for ${query}. Maybe try ${default_suggestion}?`);
    }
    if (data.total === 0) {
      return msg.send(`I couldn't find any ${query} for you. Maybe try ${default_suggestion}?`);
    }
    if (random) {
      business = data.businesses[Math.floor(Math.random() * data.businesses.length)];
    } else {
      business = data.businesses[0];
    }
    return msg.send("How about " + business.name + "? " + business.url);
  });
};

module.exports = function(robot) {
  robot.respond(/where should \w+ (eat|go for)(.*)/i, function(msg) {
    var query;
    query = msg.match[2];
    return lunchMe(msg, query);
  });
  robot.respond(/what\'?s( to eat)? for(.*)/i, function(msg) {
    var query;
    query = msg.match[2];
    return lunchMe(msg, query);
  });
  return robot.respond(/yelp me(.*)/i, function(msg) {
    var query;
    query = msg.match[1];
    return lunchMe(msg, query, false);
  });
};
