// Description:
//   Stay up-to-date on Basecamp projects
//   Powered by http://developer.github.com/v3/repos/hooks/

// Dependencies:
//   "strftime": "0.5.0"
//   "string": "1.2.1"

// Configuration:
//   HUBOT_WALKIE_USERNAME - Basecamp account username
//   HUBOT_WALKIE_PASSWORD - Basecamp account password
//   HUBOT_WALKIE_ROOMS - comma-separated list of rooms

// Commands:
//   hubot walkie on <projectURL> - Start watching events for the project
//   hubot walkie off <projectURL> - Stop watching events for the project

// Author:
//   tybenz
var S, strftime;

strftime = require('strftime');

S = require('string');

module.exports = function(robot) {
  var allRooms, auth, format, interval, pass, startListening, user;
  if (process.env.HUBOT_WALKIE_ROOMS) {
    allRooms = process.env.HUBOT_WALKIE_ROOMS.split(',');
  } else {
    allRooms = [];
  }
  user = process.env.HUBOT_WALKIE_USERNAME;
  pass = process.env.HUBOT_WALKIE_PASSWORD;
  if (user && pass) {
    auth = 'Basic ' + new Buffer(user + ':' + pass).toString('base64');
  }
  format = "%Y-%m-%dT%H:%M:%S%z";
  interval = function(ms, func) {
    return setInterval(func, ms);
  };
  // Actual listener
  startListening = function() {
    // Only start listening if our auth is set up. I.E. Configs have been set
    if (auth) {
      return interval(10000, function() {
        var i, listeners, project, results;
        listeners = robot.brain.data.walkie;
        results = [];
        for (i in listeners) {
          project = listeners[i];
          project = JSON.parse(project);
          results.push(robot.http(`https://basecamp.com/${project.accountID}/api/v1/projects/${project.projectID}/events.json?since=${project.timestamp}`).headers({
            Authorization: auth,
            Accept: 'application/json',
            'User-Agent': 'Walkie (http://walkie.tybenz.com)'
          }).get()(function(err, res, body) {
            var event, events, j, len, message, results1;
            switch (res.statusCode) {
              case 200:
                events = JSON.parse(body);
                project.timestamp = strftime(format);
                listeners[i] = JSON.stringify(project);
                results1 = [];
                for (i = j = 0, len = events.length; j < len; i = ++j) {
                  event = events[i];
                  message = `Walkie: [${project.projectName}] ${event.creator.name} ${event.summary}: ${event.url.replace(/api\/v1\//, '').replace(/\.json/g, '')}`;
                  message = S(message).unescapeHTML().s.replace(/(<([^>]+)>)/ig, "");
                  results1.push(robot.messageRoom(allRooms, message));
                }
                return results1;
                break;
              default:
                return console.log(`Issue with connection to Basecamp${body}`);
            }
          }));
        }
        return results;
      });
    } else {
      return console.log("Walkie: configs are not set");
    }
  };
  // Internal: Initialize our brain
  robot.brain.on('loaded', () => {
    var base;
    (base = robot.brain.data).walkie || (base.walkie = {});
    return startListening();
  });
  // Start listening for events on project
  robot.respond(/walkie on ([\S]*)/i, function(msg) {
    var accountID, projectID, url;
    if (!(user && pass && allRooms.length > 0)) {
      return msg.send("Walkie's config variables are not set");
    } else {
      url = msg.match[1];
      if (/http(s)?\:\/\//.test(url)) {
        accountID = parseInt(url.match(/\.com\/([0-9]*)\//)[1]);
        projectID = parseInt(url.match(/projects\/([0-9]*)/)[1]);
        return msg.http(`https://basecamp.com/${accountID}/api/v1/projects.json`).headers({
          Authorization: auth,
          Accept: 'application/json',
          'User-Agent': 'Walkie (http://walkie.tybenz.com)'
        }).get()(function(err, res, body) {
          var i, j, len, p, projects, target;
          switch (res.statusCode) {
            case 200:
              projects = JSON.parse(body);
              target = false;
              for (i = j = 0, len = projects.length; j < len; i = ++j) {
                p = projects[i];
                if (p.id === projectID) {
                  target = p;
                }
              }
              if (target) {
                robot.brain.data.walkie[`${accountID}/${projectID}`] = JSON.stringify({
                  projectName: target.name,
                  accountID: accountID,
                  projectID: projectID,
                  timestamp: strftime(format)
                });
                return msg.send(`Walkie is scanning on ${target.name}`);
              } else {
                return msg.send("Walkie could not find a project with that ID");
              }
              break;
            default:
              return msg.send(`Walkie was unable to find that frequency. WTF Basecamp?!? ${body}`);
          }
        });
      } else {
        return msg.send("Not a valid URL. Try again");
      }
    }
  });
  // Stops listening for events on project
  robot.respond(/walkie off ([\S]*)/i, function(msg) {
    var accountID, projectID, url;
    if (!(user && pass && allRooms.length > 0)) {
      return msg.send("Walkie's config variables are not set");
    } else {
      url = msg.match[1];
      if (/http(s)?\:\/\//.test(url)) {
        accountID = url.match(/\.com\/([0-9]*)\//)[1];
        projectID = url.match(/projects\/([0-9]*)-/)[1];
        if (robot.brain.data.walkie[`${accountID}/${projectID}`] != null) {
          msg.send(`Walkie has stopped scanning on ${(JSON.parse(robot.brain.data.walkie[`${accountID}/${projectID}`]).projectName)}`);
          return delete robot.brain.data.walkie[`${accountID}/${projectID}`];
        } else {
          return msg.send("Walkie was not scanning on that project.");
        }
      } else {
        return msg.send("Not a valid URL. Try again");
      }
    }
  });
  // Debugging purposes grab hash stored in brain
  robot.respond(/walkie fetch ([\S]*)/i, function(msg) {
    var data, fetch;
    fetch = msg.match[1];
    data = robot.brain.data.walkie[fetch];
    if (data) {
      return msg.send(data);
    } else {
      return msg.send(`${fetch} could not be found`);
    }
  });
  // Stop listening to all projects (clear brain)
  return robot.respond(/walkie clear/i, function(msg) {
    var i, item, ref;
    ref = robot.brain.data.walkie;
    for (i in ref) {
      item = ref[i];
      delete robot.brain.data.walkie[i];
    }
    return msg.send("Walkie is turning off and will stop scanning on all projects.");
  });
};
