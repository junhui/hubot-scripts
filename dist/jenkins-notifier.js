  // Notifies about Jenkins build errors via Jenkins Notification Plugin

  // Dependencies:
  //   "url": ""
  //   "querystring": ""

  // Configuration:
  //   Just put this url <HUBOT_URL>:<PORT>/hubot/jenkins-notify?room=<room> to your Jenkins
  //   Notification config. See here: https://wiki.jenkins-ci.org/display/JENKINS/Notification+Plugin

  // Commands:
  //   None

  // URLS:
  //   POST /hubot/jenkins-notify?room=<room>[&type=<type>][&notstrat=<notificationSTrategy>]

  // Notification Strategy is [Ff][Ss] which stands for "Failure" and "Success"
  // Capitalized letter means: notify always
  // small letter means: notify only if buildstatus has changed
  // "Fs" is the default

  // Authors:
  //   spajus
  //   k9ert (notification strategy feature)
var buildStatusChanged, querystring, shouldNotify, url,
  indexOf = [].indexOf;

url = require('url');

querystring = require('querystring');

buildStatusChanged = function(data, failing) {
  var ref, ref1, ref2, ref3;
  this.failing = failing;
  if (data.build.status === 'FAILURE' && (ref = data.name, indexOf.call(this.failing, ref) >= 0)) {
    return false;
  }
  if (data.build.status === 'FAILURE' && !(ref1 = data.name, indexOf.call(this.failing, ref1) >= 0)) {
    return true;
  }
  if (data.build.status === 'SUCCESS' && (ref2 = data.name, indexOf.call(this.failing, ref2) >= 0)) {
    return true;
  }
  if (data.build.status === 'SUCCESS' && !(ref3 = data.name, indexOf.call(this.failing, ref3) >= 0)) {
    return false;
  }
  return console.log("this should not happen");
};

shouldNotify = function(notstrat, data, failing) {
  this.failing = failing;
  if (data.build.status === 'FAILURE') {
    if (/F/.test(notstrat)) {
      return true;
    }
    return buildStatusChanged(data, this.failing);
  }
  if (data.build.status === 'SUCCESS') {
    if (/S/.test(notstrat)) {
      return true;
    }
    return buildStatusChanged(data, this.failing);
  }
};

module.exports = function(robot) {
  return robot.router.post("/hubot/jenkins-notify", function(req, res) {
    var build, data, envelope, error, index, query, ref, ref1, ref2;
    this.failing || (this.failing = []);
    query = querystring.parse(url.parse(req.url).query);
    res.end('');
    envelope = {
      notstrat: "Fs"
    };
    if (query.room) {
      envelope.room = query.room;
    }
    if (query.notstrat) {
      envelope.notstrat = query.notstrat;
    }
    if (query.type) {
      envelope.user = {
        type: query.type
      };
    }
    try {
      data = req.body;
      if (data.build.phase === 'FINISHED' || data.build.phase === 'FINALIZED') {
        if (data.build.status === 'FAILURE') {
          if (ref = data.name, indexOf.call(this.failing, ref) >= 0) {
            build = "is still";
          } else {
            build = "started";
          }
          if (shouldNotify(envelope.notstrat, data, this.failing)) {
            robot.send(envelope, `${data.name} build #${data.build.number} ${build} failing (${encodeURI(data.build.full_url)})`);
          }
          if (ref1 = data.name, indexOf.call(this.failing, ref1) < 0) {
            this.failing.push(data.name);
          }
        }
        if (data.build.status === 'SUCCESS') {
          if (ref2 = data.name, indexOf.call(this.failing, ref2) >= 0) {
            build = "was restored";
          } else {
            build = "succeeded";
          }
          if (shouldNotify(envelope.notstrat, data, this.failing)) {
            robot.send(envelope, `${data.name} build #${data.build.number} ${build} (${encodeURI(data.build.full_url)})`);
          }
          index = this.failing.indexOf(data.name);
          if (index !== -1) {
            return this.failing.splice(index, 1);
          }
        }
      }
    } catch (error1) {
      error = error1;
      console.log(`jenkins-notify error: ${error}. Data: ${req.body}`);
      return console.log(error.stack);
    }
  });
};
