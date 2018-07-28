// Description
//   Reports Klout score for a twitter handle.  The players in the competitors list
//   whose score is greater will be reported. The last 9 unique requested names
//   are kept in the competitors list. More than that will trigger the klout api's
//   per second rate limit.

// Dependencies:
//   A klout api key is needed. Signup for one at http://klout.com/s/developers/home

// Configuration:
//   HUBOT_KLOUT_API_KEY must be set in the environment. 
//   The competitors list is automatically created and includes the last 9 valid twitter handles. 

// Commands:
//   hubot klout <twitter name with or without @> - report klout score for twitter handle, and compare to competitors

// Author:
//   l_kang
var checkList, competitors, getKloutScoreByName, getKloutScores, klout_api_key;

competitors = [];

klout_api_key = function() {
  return process.env.HUBOT_KLOUT_API_KEY;
};

module.exports = function(robot) {
  return robot.respond(/.*(klout) [@]?(.+)$/i, function(msg) {
    var i, len, name, p, player;
    if (!klout_api_key()) {
      msg.send("I wont report any scores until your environment HUBOT_KLOUT_API_KEY is set");
      return;
    }
    name = msg.match[2];
    for (i = 0, len = competitors.length; i < len; i++) {
      p = competitors[i];
      if (p.name === name) {
        player = p;
      }
    }
    if (player === void 0) {
      return getKloutScoreByName(name, msg, function(result) {
        return msg.send(result);
      });
    } else {
      return checkList(name, msg, function(result) {
        return msg.send(result);
      });
    }
  });
};

checkList = function(pname, msg, callback) {
  var i, len, p, player;
  for (i = 0, len = competitors.length; i < len; i++) {
    p = competitors[i];
    if (p.name === pname) {
      player = p;
    }
  }
  if (player === void 0) {
    return false;
  }
  return getKloutScores(competitors, 0, msg, function() {
    var leaderNames, tag;
    leaderNames = (function() {
      var j, len1, results;
      results = [];
      for (j = 0, len1 = competitors.length; j < len1; j++) {
        p = competitors[j];
        if (p.score > player.score) {
          results.push(` @${p.name}`);
        }
      }
      return results;
    })();
    if (leaderNames.length === 0) {
      tag = `Nobody is ahead of @${player.name}!`;
    } else if (leaderNames.length === 1) {
      tag = `${leaderNames.join(',')} is ahead though.`;
    } else {
      tag = `${leaderNames.join(',')} are ahead though. `;
    }
    return callback(`@${player.name}'s Klout is ${player.score}. ${tag}`);
  });
};

getKloutScores = function(hashlist, index, msg, doneCallback) {
  var thisPlayer, url;
  if (hashlist.length === index) {
    return;
  }
  thisPlayer = hashlist[index];
  url = `http://api.klout.com/v2/user.json/${thisPlayer.id}/score?key=${klout_api_key()}`;
  return msg.http(url).get()(function(error, response, body) {
    var scoreRecord;
    scoreRecord = JSON.parse(body);
    thisPlayer.score = scoreRecord.score;
    if (hashlist.length === index + 1) {
      return doneCallback(thisPlayer);
    } else {
      return getKloutScores(hashlist, index + 1, msg, doneCallback);
    }
  });
};

getKloutScoreByName = function(name, msg, callback) {
  var url;
  url = `http://api.klout.com/v2/identity.json/twitter?key=${klout_api_key()}&screenName=${name}`;
  return msg.http(url).get()(function(error, response, body) {
    var i, kloutIdRec, len, nc, p, player;
    player = {
      name: name,
      id: 0,
      score: 0
    };
    if (error || response.statusCode !== 200 || body === void 0) {
      callback(`Sorry, I cant figure out who @${name} is`);
      return;
    }
    kloutIdRec = JSON.parse(body);
    player.id = kloutIdRec.id;
    // remove player if he exists, add player to the end and trim size.
    nc = competitors.slice(0);
    competitors = [];
    for (i = 0, len = nc.length; i < len; i++) {
      p = nc[i];
      if (p.name !== name) {
        competitors.push(p);
      }
    }
    competitors.push(player);
    if (competitors.length > 9) {
      competitors.shift();
    }
    return checkList(name, msg, callback);
  });
};
