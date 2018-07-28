// Description:
//   PHP's functions reference.

// Dependencies:
//   "cheerio": ""

// Configuration:
//   None

// Commands:
//   hubot phpdoc for <function> - Shows PHP function information.

// Authors:
//   nebiros
//   Carter McKendry
module.exports = function(robot) {
  return robot.respond(/phpdoc for (.+)$/i, function(msg) {
    return msg.http("http://www.php.net/manual/en/function." + msg.match[1].replace(/[_-]+/, "-") + ".php").get()(function(err, res, body) {
      var $, desc, syn, ver;
      $ = require("cheerio").load(body);
      ver = $(".refnamediv p.verinfo").text();
      desc = $(".refnamediv span.dc-title").text();
      syn = $(".methodsynopsis").text().replace(/\s+/g, " ").replace(/(\r\n|\n|\r)/gm, " ");
      if (ver && desc && syn) {
        msg.send(`${ver} - ${desc}`);
        return msg.send(syn);
      } else {
        return msg.send("Not found.");
      }
    });
  });
};
