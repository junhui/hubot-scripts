// Description:
//   Search stack overflow and provide links to the first 5 questions

// Dependencies:
//   none

// Configuration:
//   None

// Commands:
//   hubot sosearch [me] <query> - Search for the query
//   hubot sosearch [me] <query> with tags <tag list sperated by ,> - Search for the query limit to given tags

// Author:
//   carsonmcdonald
//   drdamour
var hubot_stackapps_apikey, soSearch, zlib;

zlib = require('zlib');

hubot_stackapps_apikey = 'BeOjD228tEOZP6gbYoChsg';

module.exports = function(robot) {
  return robot.respond(/sosearch( me)? (.*)/i, function(msg) {
    var opts, re;
    re = RegExp("(.*) with tags (.*)", "i");
    opts = msg.match[2].match(re);
    if (opts != null) {
      return soSearch(msg, opts[1], opts[2].split(','));
    } else {
      return soSearch(msg, msg.match[2], []);
    }
  });
};

soSearch = function(msg, search, tags) {
  var data;
  data = "";
  return msg.http("http://api.stackoverflow.com/1.1/search").query({
    intitle: encodeURIComponent(search),
    key: hubot_stackapps_apikey,
    tagged: encodeURIComponent(tags.join(':'))
  }).get(function(err, req) {
    return req.addListener("response", function(res) {
      var output;
      output = res;
      
      //pattern stolen from http://stackoverflow.com/questions/10207762/how-to-use-request-or-http-module-to-read-gzip-page-into-a-string
      if (res.headers['content-encoding'] === 'gzip') {
        output = zlib.createGunzip();
        res.pipe(output);
      }
      output.on('data', function(d) {
        return data += d.toString('utf-8');
      });
      return output.on('end', function() {
        var ans, i, len, parsedData, qs, question, results;
        parsedData = JSON.parse(data);
        if (parsedData.error) {
          msg.send(`Error searching stack overflow: ${parsedData.error.message}`);
          return;
        }
        if (parsedData.total > 0) {
          qs = (function() {
            var i, len, ref, results;
            ref = parsedData.questions.slice(0, 6);
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              question = ref[i];
              results.push(`http://www.stackoverflow.com/questions/${question.question_id} - ${question.title}`);
            }
            return results;
          })();
          if (parsedData.total - 5 > 0) {
            qs.push(`${parsedData.total - 5} more...`);
          }
          results = [];
          for (i = 0, len = qs.length; i < len; i++) {
            ans = qs[i];
            results.push(msg.send(ans));
          }
          return results;
        } else {
          return msg.reply("No questions found matching that search.");
        }
      });
    });
  })();
};
