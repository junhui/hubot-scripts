// Description:
//   Look up npm package versions

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect": "0.2.0"

// Configuration:
//   None

// Commands:
//   hubot npm version <package name> - returns npm package version if it exists

// Author:
//   redhotvengeance
var HtmlParser, Select;

HtmlParser = require("htmlparser");

Select = require("soupselect").select;

module.exports = function(robot) {
  return robot.respond(/npm version (.*)/i, function(msg) {
    var packageName;
    packageName = escape(msg.match[1]);
    return msg.http(`https://www.npmjs.org/package/${packageName}`).get()(function(err, res, body) {
      var digit, handler, i, len, metaData, parser, version, versionArray, versionString;
      if (err) {
        return msg.send("I tried talking to npmjs.org, but it seems to be ignoring me.");
      } else {
        if (res.statusCode === 200) {
          handler = new HtmlParser.DefaultHandler();
          parser = new HtmlParser.Parser(handler);
          parser.parseComplete(body);
          metaData = Select(handler.dom, ".metadata");
          versionString = metaData[0].children[3].children[3].children[1].children[0].data.toString();
          versionArray = versionString.match(/([0-9.])/ig);
          version = '';
          for (i = 0, len = versionArray.length; i < len; i++) {
            digit = versionArray[i];
            ((digit) => {
              return version += digit;
            })(digit);
          }
          return msg.send(`It looks like ${packageName} is at version ${version}.`);
        } else {
          return msg.send(`It looks like ${packageName} doesn't exist.`);
        }
      }
    });
  });
};
