// Description:
//   Android os version usage by percentage

// Dependencies:
//   "phantom": "0.5.2"
//   "cheerio": "0.12.1"

// Configuration:
//   None

// Commands:
//   hubot android usage

// Author:
//   mikebob
var api, cheerio, codenames, phantom, url;

phantom = require("phantom");

cheerio = require("cheerio");

codenames = [];

api = [];

url = "http://developer.android.com/about/dashboards/index.html";

module.exports = function(robot) {
  var last, rpad;
  last = function(arr) {
    if (arr.length > 0) {
      return arr[arr.length - 1];
    }
  };
  rpad = function(str, length) {
    while (str.length < length) {
      str = str + '.';
    }
    return str;
  };
  return robot.respond(/android usage?$/i, function(msg) {
    return phantom.create(function(ph) {
      return ph.createPage(function(page) {
        return page.open(url, function(status) {
          return page.evaluate(function() {
            return {
              message: document.getElementById("version-chart").innerHTML
            };
          }, function(result) {
            var $, res;
            $ = cheerio.load(result.message, {
              ignoreWhitespace: true
            });
            res = $("tr").slice(1).map(function(i, el) {
              var nameapi, percent, tds, v;
              v = cheerio.load(this);
              tds = v("td");
              if (tds.length === 3) {
                codenames.push(last(codenames)); // repeat codename
                api.push(tds.eq(1).html());
              } else {
                codenames.push(tds.eq(1).html());
                api.push(tds.eq(2).html());
              }
              percent = tds.last().html();
              nameapi = rpad(`${last(codenames)} [${last(api)}] `, 30);
              return `${nameapi} ${percent}`;
            }).join('\n');
            msg.send(`${res}`);
            return ph.exit();
          });
        });
      });
    });
  });
};
