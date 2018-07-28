// Description:
//   Interact with Gerrit. (http://code.google.com/p/gerrit/)

// Dependencies:

// Configuration:
//   HUBOT_GERRIT_SSH_URL
//   HUBOT_GERRIT_EVENTSTREAM_ROOMS

// Commands:
//   hubot gerrit search <query> - Search Gerrit for changes - the query should follow the normal Gerrit query rules
//   hubot gerrit (ignore|report) events for (project|user|event) <thing> - Tell Hubot how to report Gerrit events

// Notes:
//   Hubot has to be running as a user who has registered a SSH key with Gerrit

// Author:
//   nparry
var cp, eventStreamMe, eventStreamRooms, extractName, extractReviews, formatDate, formatters, ignoreOrReportEventsMe, ignoresOfType, robotRooms, searchMe, sshUrl, url;

cp = require("child_process");

url = require("url");

// Required - The SSH URL for your Gerrit server.
sshUrl = process.env.HUBOT_GERRIT_SSH_URL || "";

// Optional - A comma separated list of rooms to receive spam about Gerrit events.
//   If not set, messages will be sent to all room of which Hubot is a member.
//   To disable event stream spam, use the value "disabled"
eventStreamRooms = process.env.HUBOT_GERRIT_EVENTSTREAM_ROOMS;

// TODO: Make these template driven with env-var overrides possible.
// See the following for descriptions of the input JSON data:
// http://gerrit-documentation.googlecode.com/svn/Documentation/2.4/json.html
// http://gerrit-documentation.googlecode.com/svn/Documentation/2.4/cmd-stream-events.html
formatters = {
  queryResult: function(json) {
    return `'${json.change.subject}' for ${json.change.project}/${json.change.branch} by ${extractName(json.change)} on ${formatDate(json.change.lastUpdated)}: ${json.change.url}`;
  },
  events: {
    "patchset-created": function(json) {
      return `${extractName(json)} uploaded patchset ${json.patchSet.number} of '${json.change.subject}' for ${json.change.project}/${json.change.branch}: ${json.change.url}`;
    },
    "change-abandoned": function(json) {
      return `${extractName(json)} abandoned '${json.change.subject}' for ${json.change.project}/${json.change.branch}: ${json.change.url}`;
    },
    "change-restored": function(json) {
      return `${extractName(json)} restored '${json.change.subject}' for ${json.change.project}/${json.change.branch}: ${json.change.url}`;
    },
    "change-merged": function(json) {
      return `${extractName(json)} merged patchset ${json.patchSet.number} of '${json.change.subject}' for ${json.change.project}/${json.change.branch}: ${json.change.url}`;
    },
    "comment-added": function(json) {
      return `${extractName(json)} reviewed patchset ${json.patchSet.number} (${extractReviews(json)}) of '${json.change.subject}' for ${json.change.project}/${json.change.branch}: ${json.change.url}`;
    },
    "ref-updated": function(json) {
      return `${extractName(json)} updated reference ${json.refUpdate.project}/${json.refUpdate.refName}`;
    }
  }
};

formatDate = function(seconds) {
  return new Date(seconds * 1000).toDateString();
};

extractName = function(json) {
  var account;
  account = json.uploader || json.abandoner || json.restorer || json.submitter || json.author || json.owner;
  return (account != null ? account.name : void 0) || (account != null ? account.email : void 0) || "Gerrit";
};

extractReviews = function(json) {
  var a;
  return ((function() {
    var i, len, ref, results1;
    ref = json.approvals;
    results1 = [];
    for (i = 0, len = ref.length; i < len; i++) {
      a = ref[i];
      results1.push(`${a.description}=${a.value}`);
    }
    return results1;
  })()).join(",");
};

module.exports = function(robot) {
  var gerrit;
  gerrit = url.parse(sshUrl);
  if (!gerrit.port) {
    gerrit.port = 22;
  }
  if (gerrit.protocol !== "ssh:" || gerrit.hostname === "") {
    return robot.logger.error(`Gerrit commands inactive because HUBOT_GERRIT_SSH_URL=${gerrit.href} is not a valid SSH URL`);
  } else {
    if (eventStreamRooms !== "disabled") {
      eventStreamMe(robot, gerrit);
    }
    robot.respond(/gerrit (?:search|query)(?: me)? (.+)/i, searchMe(robot, gerrit));
    return robot.respond(/gerrit (ignore|report)(?: me)? events for (project|user|event) (.+)/i, ignoreOrReportEventsMe(robot, gerrit));
  }
};

searchMe = function(robot, gerrit) {
  return function(msg) {
    return cp.exec(`ssh ${gerrit.hostname} -p ${gerrit.port} gerrit query --format=JSON -- ${msg.match[1]}`, function(err, stdout, stderr) {
      var i, l, len, r, results, results1, status;
      if (err) {
        return msg.send(`Sorry, something went wrong talking with Gerrit: ${stderr}`);
      } else {
        results = (function() {
          var i, len, ref, results1;
          ref = stdout.split("\n");
          results1 = [];
          for (i = 0, len = ref.length; i < len; i++) {
            l = ref[i];
            if (l !== "") {
              results1.push(JSON.parse(l));
            }
          }
          return results1;
        })();
        status = results[results.length - 1];
        if (status.type === "error") {
          return msg.send(`Sorry, Gerrit didn't like your query: ${status.message}`);
        } else if (status.rowCount === 0) {
          return msg.send("Gerrit didn't find anything matching your query");
        } else {
          results1 = [];
          for (i = 0, len = results.length; i < len; i++) {
            r = results[i];
            if (r.id) {
              results1.push(msg.send(formatters.queryResult({
                change: r
              })));
            }
          }
          return results1;
        }
      }
    });
  };
};

ignoreOrReportEventsMe = function(robot, gerrit) {
  return function(msg) {
    var base, base1, base2, ignores, t, thing, type;
    type = msg.match[2].toLowerCase();
    thing = msg.match[3];
    ignores = (function() {
      var i, len, ref, results1;
      ref = ignoresOfType(robot, type);
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        t = ref[i];
        if (t !== thing) {
          results1.push(t);
        }
      }
      return results1;
    })();
    if (msg.match[1] === "ignore") {
      ignores.push(thing);
    }
    if ((base = robot.brain.data).gerrit == null) {
      base.gerrit = {};
    }
    if ((base1 = robot.brain.data.gerrit).eventStream == null) {
      base1.eventStream = {};
    }
    if ((base2 = robot.brain.data.gerrit.eventStream).ignores == null) {
      base2.ignores = {};
    }
    robot.brain.data.gerrit.eventStream.ignores[type] = ignores;
    return msg.send(`Got it, the updated list of Gerrit ${type}s to ignore is ${ignores.join(', ') || 'empty'}`);
  };
};

eventStreamMe = function(robot, gerrit) {
  var done, isIgnored, isWanted, reconnect, streamEvents;
  robot.logger.info("Gerrit stream-events: Starting connection");
  streamEvents = cp.spawn("ssh", [gerrit.hostname, "-p", gerrit.port, "gerrit", "stream-events"]);
  done = false;
  reconnect = null;
  robot.brain.on("close", function() {
    done = true;
    if (reconnect) {
      clearTimeout(reconnect);
    }
    return streamEvents.stdin.end();
  });
  streamEvents.on("exit", function(code) {
    robot.logger.info(`Gerrit stream-events: Connection lost (rc=${code})`);
    if (!done) {
      return reconnect = setTimeout((function() {
        return eventStreamMe(robot, gerrit);
      }), 10 * 1000);
    }
  });
  isIgnored = function(type, thing) {
    var t;
    return ((function() {
      var i, len, ref, results1;
      ref = ignoresOfType(robot, type);
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        t = ref[i];
        if (t === thing) {
          results1.push(t);
        }
      }
      return results1;
    })()).length !== 0;
  };
  isWanted = function(event) {
    return !(isIgnored("project", (event.change || event.refUpdate).project) || isIgnored("user", extractName(event)) || isIgnored("event", event.type));
  };
  streamEvents.stderr.on("data", function(data) {
    return robot.logger.info(`Gerrit stream-events: ${data}`);
  });
  return streamEvents.stdout.on("data", function(data) {
    var error, formatter, i, json, len, msg, ref, results1, room;
    robot.logger.debug(`Gerrit stream-events: ${data}`);
    json = (function() {
      try {
        return JSON.parse(data);
      } catch (error1) {
        error = error1;
        robot.logger.error(`Gerrit stream-events: Error parsing Gerrit JSON. Error=${error}, Event=${data}`);
        return null;
      }
    })();
    if (!json) {
      return;
    }
    formatter = formatters.events[json.type];
    msg = (function() {
      try {
        if (formatter) {
          return formatter(json);
        }
      } catch (error1) {
        error = error1;
        robot.logger.error(`Gerrit stream-events: Error formatting event. Error=${error}, Event=${data}`);
        return null;
      }
    })();
    if (formatter === null) {
      return robot.logger.info(`Gerrit stream-events: Unrecognized event ${data}`);
    } else if (msg && isWanted(json)) {
      ref = robotRooms(robot);
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        room = ref[i];
        // Bug in messageRoom? Doesn't work with multiple rooms
        //robot.messageRoom room, "Gerrit: #{msg}" for room in robotRooms robot
        results1.push(robot.send({
          room: room
        }, `Gerrit: ${msg}`));
      }
      return results1;
    }
  });
};

ignoresOfType = function(robot, type) {
  var ref, ref1, ref2;
  return ((ref = robot.brain.data.gerrit) != null ? (ref1 = ref.eventStream) != null ? (ref2 = ref1.ignores) != null ? ref2[type] : void 0 : void 0 : void 0) || [];
};

robotRooms = function(robot) {
  var i, k, len, r, ref, results1, roomlists, v;
  roomlists = (function() {
    var ref, results1;
    if (eventStreamRooms) {
      return [eventStreamRooms];
    } else {
      ref = process.env;
      results1 = [];
      for (k in ref) {
        v = ref[k];
        if (/^HUBOT_.+_ROOMS/i.exec(k) !== null) {
          results1.push(v);
        }
      }
      return results1;
    }
  })();
  if (roomlists.length === 0) {
    robot.logger.error("Gerrit stream-events: Unable to determine the list of rooms");
  }
  ref = (roomlists[0] || "").split(",");
  results1 = [];
  for (i = 0, len = ref.length; i < len; i++) {
    r = ref[i];
    if (r !== "") {
      results1.push(r);
    }
  }
  return results1;
};
