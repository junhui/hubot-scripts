// Description:
//   None

// Dependencies:
//   "date-utils": ">=1.2.5"
//   "hubucket": "git+ssh://git@github.com:pyro2927/hubucket.git"

// Configuration:
//   HUBOT_BITBUCKET_USER
//   HUBOT_BITBUCKET_PASSWORD

// Commands:
//   hubot repo show <repo> - shows activity of repository

// Author:
//   pyro2927
require('date-utils');

module.exports = function(robot) {
  var bitbucket;
  bitbucket = require("hubucket")(robot);
  return robot.respond(/repo show (.*)$/i, function(msg) {
    var repo, url;
    repo = bitbucket.qualified_repo(msg.match[1]);
    url = `repositories/${repo}/events/`;
    return bitbucket.get(url, function(data) {
      var c, commit, d, i, len, ref, results, send, stamp;
      if (data.message) {
        return msg.send(`Achievement unlocked: [NEEDLE IN A HAYSTACK] repository ${data.message}!`);
      } else if (data.events.length === 0) {
        return msg.send("Achievement unlocked: [LIKE A BOSS] no commits found!");
      } else {
        msg.send(`https://bitbucket.com/${repo}`);
        send = 5;
        ref = data.events;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          c = ref[i];
          if (send && c.description !== null) {
            results.push((function() {
              var j, len1, ref1, results1;
              ref1 = c.description.commits;
              results1 = [];
              for (j = 0, len1 = ref1.length; j < len1; j++) {
                commit = ref1[j];
                d = new Date(Date.parse(c.created_on)).toFormat("MM/DD/YY HH24:MI");
                stamp = `${d}`;
                if (c.user) {
                  // events aren't always related to a user, do only conditionally add in the username
                  stamp = stamp + ` -> ${c.user.username}`;
                }
                // msg.send "#{JSON.stringify(c)}"
                msg.send(`[${stamp}] ${commit.description}`);
                results1.push(send -= 1);
              }
              return results1;
            })());
          } else {
            results.push(void 0);
          }
        }
        return results;
      }
    });
  });
};
