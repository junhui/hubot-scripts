// Description:
//   Find a Drupal module using modulepuppy.heroku.com

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot there's a module for <that>
//   hubot module me <something> - Returns links to modules or themes on drupal.org

// Author:
//   henrrrik
var puppySearch;

module.exports = function(robot) {
  robot.hear(/there's a module for (.*)/i, function(msg) {
    return puppySearch(msg, msg.match[1]);
  });
  return robot.respond(/module me (.*)/i, function(msg) {
    return puppySearch(msg, msg.match[1]);
  });
};

puppySearch = function(msg, query) {
  return msg.http('http://modulepuppy.heroku.com/search.json').query({
    query: query
  }).get()(function(err, res, body) {
    var i, len, modules, ref, result, results;
    results = JSON.parse(body);
    modules = [];
    ref = results.slice(0, 31);
    for (i = 0, len = ref.length; i < len; i++) {
      result = ref[i];
      modules.push(`${result.project.title}: ${result.project.link}`);
    }
    if (modules.length > 0) {
      return msg.send(modules.join('\n'));
    } else {
      return msg.send("Actually, there isn't a module for that!");
    }
  });
};
