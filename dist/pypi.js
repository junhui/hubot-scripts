// Description:
//   Simple Python Package Index querying using XMLRPC API.

// Dependencies:
//   "pypi": ""

// Configuration:
//   HUBOT_PYPI_URL (defaults to http://pypi.python.org/pypi)

// Commands:
//   hubot show latest from pypi for <package> - Shows latest version of Python package registered at PyPI
//   hubot show total downloads from pypi for <package> - Shows total number of downloads across all versions of Python package registered at PyPI

// Author:
//   lukaszb
var createClient, pypi, showLatestPackage, showTotalDownloads;

pypi = require("pypi");

createClient = function() {
  return new pypi.Client(process.env.HUBOT_PYPI_URL || "http://pypi.python.org/pypi");
};

showLatestPackage = function(msg, pkg) {
  var client;
  client = createClient();
  return client.getPackageReleases(pkg, function(versions) {
    var latestVersion;
    if (versions.length) {
      latestVersion = versions.sort()[versions.length - 1];
      return msg.send(`Latest version of ${pkg} is ${latestVersion}`);
    }
  });
};

showTotalDownloads = function(msg, pkg) {
  var client;
  client = createClient();
  return client.getPackageReleases(pkg, function(versions) {
    var i, len, results, todo, totalDownloads, version;
    totalDownloads = 0;
    todo = versions.length;
    results = [];
    for (i = 0, len = versions.length; i < len; i++) {
      version = versions[i];
      results.push(client.getReleaseDownloads(pkg, version, function(downloads) {
        var count, e, j, len1, ref;
        ref = (function() {
          var k, len1, results1;
          results1 = [];
          for (k = 0, len1 = downloads.length; k < len1; k++) {
            e = downloads[k];
            results1.push(e[1]);
          }
          return results1;
        })();
        for (j = 0, len1 = ref.length; j < len1; j++) {
          count = ref[j];
          totalDownloads += count;
        }
        todo -= 1;
        if (todo === 0) {
          return msg.send(`Total downloads of ${pkg}: ${totalDownloads}`);
        }
      }));
    }
    return results;
  });
};

module.exports = function(robot) {
  robot.respond(/show latest from pypi for (.*)/i, function(msg) {
    var pkg;
    pkg = msg.match[1];
    return showLatestPackage(msg, pkg);
  });
  return robot.respond(/show total downloads from pypi for (.*)/i, function(msg) {
    var pkg;
    pkg = msg.match[1];
    return showTotalDownloads(msg, pkg);
  });
};
