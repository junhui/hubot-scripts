// Description:
//   Grab a headline from ESPN through querying hubot

// Dependencies:
//   None

// Configuration:
//   HUBOT_ESPN_ACCOUNT_KEY

// Commands:
//   hubot espn headline - Displays a random headline from ESPN.com
//   hubot espn mlb <name of team> - Displays ESPN.com MLB team homepage
//   hubot espn nfl <name of team> - Displays ESPN.com NFL team homepage
//   hubot espn nba <name of team> - Displays ESPN.com NBA team homepage
//   hubot espn nhl <name of team> - Displays ESPN.com NHL team homepage

// Author:
//   mjw56
var espnApiKey, getTeamPage;

espnApiKey = process.env.HUBOT_ESPN_ACCOUNT_KEY;

if (!espnApiKey) {
  throw "You must enter your HUBOT_ESPN_ACCOUNT_KEY in your environment variables";
}

module.exports = function(robot) {
  robot.respond(/espn headline/i, function(msg) {
    var search;
    search = escape(msg.match[2]);
    return msg.http('http://api.espn.com/v1/sports/news/headlines?apikey=' + espnApiKey).get()(function(err, res, body) {
      var child, i, len, ref, result, rnd, urls;
      result = JSON.parse(body);
      if (result.headlines.count <= 0) {
        msg.send("Couldn't find any headlines");
        return;
      }
      urls = [];
      ref = result.headlines;
      for (i = 0, len = ref.length; i < len; i++) {
        child = ref[i];
        urls.push(child.headline + "-  " + child.links.web.href);
      }
      rnd = Math.floor(Math.random() * urls.length);
      return msg.send(urls[rnd]);
    });
  });
  robot.respond(/(espn)( mlb) (.*)/i, function(msg) {
    return msg.http('http://api.espn.com/v1/sports/baseball/mlb/teams?apikey=' + espnApiKey).get()(function(err, res, body) {
      var result;
      result = JSON.parse(body);
      return getTeamPage(msg, result, function(url) {
        return msg.send(url);
      });
    });
  });
  robot.respond(/(espn)( nfl) (.*)/i, function(msg) {
    return msg.http('http://api.espn.com/v1/sports/football/nfl/teams?apikey=' + espnApiKey).get()(function(err, res, body) {
      var result;
      result = JSON.parse(body);
      return getTeamPage(msg, result, function(url) {
        return msg.send(url);
      });
    });
  });
  robot.respond(/(espn)( nba) (.*)/i, function(msg) {
    return msg.http('http://api.espn.com/v1/sports/basketball/nba/teams?apikey=' + espnApiKey).get()(function(err, res, body) {
      var result;
      result = JSON.parse(body);
      return getTeamPage(msg, result, function(url) {
        return msg.send(url);
      });
    });
  });
  return robot.respond(/(espn)( nhl) (.*)/i, function(msg) {
    return msg.http('http://api.espn.com/v1/sports/hockey/nhl/teams?apikey=' + espnApiKey).get()(function(err, res, body) {
      var result;
      result = JSON.parse(body);
      return getTeamPage(msg, result, function(url) {
        return msg.send(url);
      });
    });
  });
};

getTeamPage = function(msg, json, cb) {
  var child, city, found, i, input, len, ref, team;
  found = false;
  ref = json.sports[0].leagues[0].teams;
  for (i = 0, len = ref.length; i < len; i++) {
    child = ref[i];
    team = child.name.toLowerCase();
    city = child.location.toLowerCase();
    input = msg.match[3].toLowerCase();
    if (team === input || city === input) {
      found = true;
      cb('Team news for the ' + child.location + ' ' + child.name + '- ' + child.links.web.teams.href);
    }
  }
  if (!found) {
    return cb('Could not find that team');
  }
};
