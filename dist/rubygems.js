// Description:
//   Find a rubygem from rubygems.org

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot there's a gem for <that> - Returns a link to a gem on rubygems.org

// Author:
//   sferik
module.exports = function(robot) {
  return robot.respond(/there's a gem for (.*)/i, function(msg) {
    var search;
    search = msg.match[1];
    return msg.http('https://rubygems.org/api/v1/search.json').query({
      query: search
    }).get()(function(err, res, body) {
      var gems, i, len, ref, result, results;
      results = JSON.parse(body);
      gems = [];
      ref = results.slice(0, 5);
      for (i = 0, len = ref.length; i < len; i++) {
        result = ref[i];
        gems.push(`${result.name}: https://rubygems.org/gems/${result.name}`);
      }
      if (gems.length > 0) {
        return msg.send(gems.join('\n'));
      } else {
        return msg.send("Actually, there isn't a gem for that!");
      }
    });
  });
};
