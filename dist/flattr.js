// Description:
//   Interact with the Flattr API

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   thing me <id> - Returns information about a flattr thing
//   hubot user me <username> - Returns information about a flattr user
//   hubot search things <query> - Search flattrs things

// Author:
//   simon
module.exports = function(robot) {
  robot.respond(/search things (.*)/i, function(msg) {
    var query;
    query = msg.match[1];
    return msg.http("https://api.flattr.com/rest/v2/things/search").query({
      query: query
    }).headers({
      Accept: "application/json"
    }).get()(function(err, res, body) {
      var i, len, results, search, thing, things;
      if (err) {
        msg.send(`Flattr says: ${err}`);
        return;
      }
      search = JSON.parse(body);
      msg.send(`I found ${search.total_items} things when looking for "${query}". The top 3 are:`);
      things = search.things.slice(0, 3);
      results = [];
      for (i = 0, len = things.length; i < len; i++) {
        thing = things[i];
        results.push(msg.send(`[${thing.flattrs}] ${thing.title} (${thing.url}) owned by ${thing.owner.username} -> ${thing.link}`));
      }
      return results;
    });
  });
  robot.respond(/user (?:me )?(?:http(?:s)?:\/\/flattr.com\/profile\/)?(.*)$/i, function(msg) {
    var user;
    user = msg.match[1].trim();
    return msg.http(`https://api.flattr.com/rest/v2/users/${user}`).headers({
      Accept: "application/json"
    }).get()(function(err, res, body) {
      var response;
      if (err) {
        msg.send(`Flattr says: ${err}`);
        return;
      }
      user = JSON.parse(body);
      if (user.error === "not_found") {
        msg.send("There is no user with that username...");
        return;
      }
      response = `Flattr user: ${user.username}`;
      if (user.firstname && user.lastname) {
        response = response + ` (${user.firstname} ${user.lastname})`;
      } else if (user.firstname) {
        response = response + ` (${user.firstname})`;
      } else if (user.lastname) {
        response = response + ` (${user.lastname})`;
      }
      if (user.city || user.country) {
        response = response + " from ";
        if (user.city) {
          response = response + `${user.city}, `;
        }
        if (user.country) {
          response = response + `${user.country}`;
        }
      }
      if (user.url) {
        response = response + ` [${user.url}]`;
      }
      msg.send(response);
      // Profile
      return msg.send(`More: ${user.link}`);
    });
  });
  robot.hear(/(?:http(?:s)?:\/\/flattr.com\/(?:t|thing)\/|thing me )(\d+)/i, function(msg) {
    var id;
    id = msg.match[1];
    return msg.http(`https://api.flattr.com/rest/v2/things/${id}`).headers({
      Accept: "application/json"
    }).get()(function(err, res, body) {
      var thing;
      if (err) {
        msg.send(`Flattr says: ${err}`);
        return;
      }
      thing = JSON.parse(body);
      return msg.send(`Thing: [${thing.flattrs}] ${thing.title} - ${thing.link}`);
    });
  });
  return robot.hear(/(https?:\/\/[-a-zA-Z0-9+&@#\/%?=~_|$!:,.;]*)/, function(msg) {
    var url;
    url = msg.match[1];
    return msg.http("https://api.flattr.com/rest/v2/things/lookup").query({
      'url': url
    }).headers({
      Accept: "application/json"
    }).get()(function(err, res, body) {
      var location;
      if (err) {
        return;
      }
      location = JSON.parse(body);
      if (location.message === 'found') {
        return msg.http(location.location).headers({
          Accept: "application/json"
        }).get()(function(err, res, body) {
          var thing;
          thing = JSON.parse(body);
          return msg.send(`Thing: [${thing.flattrs}] ${thing.title} - ${thing.link}`);
        });
      }
    });
  });
};
