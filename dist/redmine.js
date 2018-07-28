  // Description:
  //   Showing of redmine issue via the REST API
  //   It also listens for the #nnnn format and provides issue data and link
  //   Eg. "Hey guys check out #273"

  // Dependencies:
  //   None

  // Configuration:
  //   HUBOT_REDMINE_SSL
  //   HUBOT_REDMINE_BASE_URL
  //   HUBOT_REDMINE_TOKEN
  //   HUBOT_REDMINE_IGNORED_USERS

  // Commands:
  //   hubot (redmine|show) me <issue-id> - Show the issue status
  //   hubot show (my|user's) issues - Show your issues or another user's issues
  //   hubot assign <issue-id> to <user-first-name> ["notes"] - Assign the issue to the user (searches login or firstname)
  //   hubot update <issue-id> with "<note>" - Adds a note to the issue
  //   hubot add <hours> hours to <issue-id> ["comments"] - Adds hours to the issue with the optional comments
  //   hubot link me <issue-id> - Returns a link to the redmine issue
  //   hubot set <issue-id> to <int>% ["comments"] - Updates an issue and sets the percent done

  // Notes:
  //   <issue-id> can be formatted in the following ways: 1234, #1234,
  //   issue 1234, issue #1234

  // Author:
  //   robhurring
var HTTP, QUERY, Redmine, URL, formatDate, resolveUsers,
  indexOf = [].indexOf;

if (process.env.HUBOT_REDMINE_SSL != null) {
  HTTP = require('https');
} else {
  HTTP = require('http');
}

URL = require('url');

QUERY = require('querystring');

module.exports = function(robot) {
  var redmine;
  redmine = new Redmine(process.env.HUBOT_REDMINE_BASE_URL, process.env.HUBOT_REDMINE_TOKEN);
  // Robot link me <issue>
  robot.respond(/link me (?:issue )?(?:#)?(\d+)/i, function(msg) {
    var id;
    id = msg.match[1];
    return msg.reply(`${redmine.url}/issues/${id}`);
  });
  // Robot set <issue> to <percent>% ["comments"]
  robot.respond(/set (?:issue )?(?:#)?(\d+) to (\d{1,3})%?(?: "?([^"]+)"?)?/i, function(msg) {
    var attributes, id, notes, percent;
    [id, percent, notes] = msg.match.slice(1, 4);
    percent = parseInt(percent);
    if (notes != null) {
      notes = `${msg.message.user.name}: ${userComments}`;
    } else {
      notes = `Ratio set by: ${msg.message.user.name}`;
    }
    attributes = {
      "notes": notes,
      "done_ratio": percent
    };
    return redmine.Issue(id).update(attributes, function(err, data, status) {
      if (status === 200) {
        return msg.reply(`Set #${id} to ${percent}%`);
      } else {
        return msg.reply(`Update failed! (${err})`);
      }
    });
  });
  // Robot add <hours> hours to <issue_id> ["comments for the time tracking"]
  robot.respond(/add (\d{1,2}) hours? to (?:issue )?(?:#)?(\d+)(?: "?([^"]+)"?)?/i, function(msg) {
    var attributes, comments, hours, id, userComments;
    [hours, id, userComments] = msg.match.slice(1, 4);
    hours = parseInt(hours);
    if (userComments != null) {
      comments = `${msg.message.user.name}: ${userComments}`;
    } else {
      comments = `Time logged by: ${msg.message.user.name}`;
    }
    attributes = {
      "issue_id": id,
      "hours": hours,
      "comments": comments
    };
    return redmine.TimeEntry(null).create(attributes, function(error, data, status) {
      if (status === 201) {
        return msg.reply("Your time was logged");
      } else {
        return msg.reply("Nothing could be logged. Make sure RedMine has a default activity set for time tracking. (Settings -> Enumerations -> Activities)");
      }
    });
  });
  // Robot show <my|user's> [redmine] issues
  robot.respond(/show (?:my|(\w+\'s)) (?:redmine )?issues/i, function(msg) {
    var firstName, userMode;
    userMode = true;
    firstName = msg.match[1] != null ? (userMode = false, msg.match[1].replace(/\'.+/, '')) : msg.message.user.name.split(/\s/)[0];
    return redmine.Users({
      name: firstName
    }, function(err, data) {
      var params, user;
      if (!(data.total_count > 0)) {
        msg.reply(`Couldn't find any users with the name "${firstName}"`);
        return false;
      }
      user = resolveUsers(firstName, data.users)[0];
      params = {
        "assigned_to_id": user.id,
        "limit": 25,
        "status_id": "open",
        "sort": "priority:desc"
      };
      return redmine.Issues(params, function(err, data) {
        var _, issue, j, len, ref;
        if (err != null) {
          return msg.reply("Couldn't get a list of issues for you!");
        } else {
          _ = [];
          if (userMode) {
            _.push(`You have ${data.total_count} issue(s).`);
          } else {
            _.push(`${user.firstname} has ${data.total_count} issue(s).`);
          }
          ref = data.issues;
          for (j = 0, len = ref.length; j < len; j++) {
            issue = ref[j];
            (function(issue) {
              return _.push(`\n[${issue.tracker.name} - ${issue.priority.name} - ${issue.status.name}] #${issue.id}: ${issue.subject}`);
            })(issue);
          }
          return msg.reply(_.join("\n"));
        }
      });
    });
  });
  // Robot update <issue> with "<note>"
  robot.respond(/update (?:issue )?(?:#)?(\d+)(?:\s*with\s*)?(?:[-:,])? (?:"?([^"]+)"?)/i, function(msg) {
    var attributes, id, note;
    [id, note] = msg.match.slice(1, 3);
    attributes = {
      "notes": `${msg.message.user.name}: ${note}`
    };
    return redmine.Issue(id).update(attributes, function(err, data, status) {
      if (data == null) {
        if (status === 404) {
          return msg.reply(`Issue #${id} doesn't exist.`);
        } else {
          return msg.reply("Couldn't update this issue, sorry :(");
        }
      } else {
        return msg.reply(`Done! Updated #${id} with "${note}"`);
      }
    });
  });
  // Robot add issue to "<project>" [traker <id>] with "<subject>"
  robot.respond(/add (?:issue )?(?:\s*to\s*)?(?:"?([^" ]+)"? )(?:tracker\s)?(\d+)?(?:\s*with\s*)("?([^"]+)"?)/i, function(msg) {
    var attributes, project_id, subject, tracker_id;
    [project_id, tracker_id, subject] = msg.match.slice(1, 4);
    attributes = {
      "project_id": `${project_id}`,
      "subject": `${subject}`
    };
    if (tracker_id != null) {
      attributes = {
        "project_id": `${project_id}`,
        "subject": `${subject}`,
        "tracker_id": `${tracker_id}`
      };
    }
    return redmine.Issue().add(attributes, function(err, data, status) {
      if (data == null) {
        if (status === 404) {
          return msg.reply(`Couldn't update this issue, ${status} :(`);
        }
      } else {
        return msg.reply(`Done! Added issue ${data.id} with "${subject}"`);
      }
    });
  });
  // Robot assign <issue> to <user> ["note to add with the assignment]
  robot.respond(/assign (?:issue )?(?:#)?(\d+) to (\w+)(?: "?([^"]+)"?)?/i, function(msg) {
    var id, note, userName;
    [id, userName, note] = msg.match.slice(1, 4);
    return redmine.Users({
      name: userName
    }, function(err, data) {
      var attributes, user;
      if (!(data.total_count > 0)) {
        msg.reply(`Couldn't find any users with the name "${userName}"`);
        return false;
      }
      // try to resolve the user using login/firstname -- take the first result (hacky)
      user = resolveUsers(userName, data.users)[0];
      attributes = {
        "assigned_to_id": user.id
      };
      if (note != null) {
        // allow an optional note with the re-assign
        attributes["notes"] = `${msg.message.user.name}: ${note}`;
      }
      // get our issue
      return redmine.Issue(id).update(attributes, function(err, data, status) {
        if (data == null) {
          if (status === 404) {
            return msg.reply(`Issue #${id} doesn't exist.`);
          } else {
            return msg.reply("There was an error assigning this issue.");
          }
        } else {
          msg.reply(`Assigned #${id} to ${user.firstname}.`);
          if (parseInt(id) === 3631) {
            return msg.send('/play trombone');
          }
        }
      });
    });
  });
  // Robot redmine me <issue>
  robot.respond(/(?:redmine|show)(?: me)? (?:issue )?(?:#)?(\d+)/i, function(msg) {
    var id, params;
    id = msg.match[1];
    params = {
      "include": "journals"
    };
    return redmine.Issue(id).show(params, function(err, data, status) {
      var _, issue, j, journal, len, ref, ref1, ref2;
      if (status !== 200) {
        msg.reply(`Issue #${id} doesn't exist.`);
        return false;
      }
      issue = data.issue;
      _ = [];
      _.push(`\n[${issue.project.name} - ${issue.priority.name}] ${issue.tracker.name} #${issue.id} (${issue.status.name})`);
      _.push(`Assigned: ${(ref = (ref1 = issue.assigned_to) != null ? ref1.name : void 0) != null ? ref : 'Nobody'} (opened by ${issue.author.name})`);
      if (issue.status.name.toLowerCase() !== 'new') {
        _.push(`Progress: ${issue.done_ratio}% (${issue.spent_hours} hours)`);
      }
      _.push(`Subject: ${issue.subject}`);
      _.push(`\n${issue.description}`);
      // journals
      _.push("\n" + Array(10).join('-') + '8<' + Array(50).join('-') + "\n");
      ref2 = issue.journals;
      for (j = 0, len = ref2.length; j < len; j++) {
        journal = ref2[j];
        (function(journal) {
          var date;
          if ((journal.notes != null) && journal.notes !== "") {
            date = formatDate(journal.created_on, 'mm/dd/yyyy (hh:ii ap)');
            _.push(`${journal.user.name} on ${date}:`);
            return _.push(`    ${journal.notes}\n`);
          }
        })(journal);
      }
      return msg.reply(_.join("\n"));
    });
  });
  // Listens to #NNNN and gives ticket info
  return robot.hear(/.*(#(\d+)).*/, function(msg) {
    var id, ignoredUsers, params, ref;
    id = msg.match[1].replace(/#/, "");
    ignoredUsers = process.env.HUBOT_REDMINE_IGNORED_USERS || "";
    //Ignore cetain users, like Redmine plugins
    if (ref = msg.message.user.name, indexOf.call(ignoredUsers.split(','), ref) >= 0) {
      return;
    }
    if (isNaN(id)) {
      return;
    }
    params = [];
    return redmine.Issue(id).show(params, function(err, data, status) {
      var issue, url;
      if (status !== 200) {
        // Issue not found, don't say anything
        return false;
      }
      issue = data.issue;
      url = `${redmine.url}/issues/${id}`;
      return msg.send(`${issue.tracker.name} <a href="${url}">#${issue.id}</a> (${issue.project.name}): ${issue.subject} (${issue.status.name}) [${issue.priority.name}]`);
    });
  });
};

// simple ghetto fab date formatter this should definitely be replaced, but didn't want to
// introduce dependencies this early

// dateStamp - any string that can initialize a date
// fmt - format string that may use the following elements
//       mm - month
//       dd - day
//       yyyy - full year
//       hh - hours
//       ii - minutes
//       ss - seconds
//       ap - am / pm

// returns the formatted date
formatDate = function(dateStamp, fmt = 'mm/dd/yyyy at hh:ii ap') {
  var ap, d, h, i, m, s, y;
  d = new Date(dateStamp);
  // split up the date
  [m, d, y, h, i, s, ap] = [d.getMonth() + 1, d.getDate(), d.getFullYear(), d.getHours(), d.getMinutes(), d.getSeconds(), 'AM'];
  if (i < 10) {
    // leadig 0s
    i = `0${i}`;
  }
  if (s < 10) {
    s = `0${s}`;
  }
  // adjust hours
  if (h > 12) {
    h = h - 12;
    ap = "PM";
  }
  // ghetto fab!
  return fmt.replace(/mm/, m).replace(/dd/, d).replace(/yyyy/, y).replace(/hh/, h).replace(/ii/, i).replace(/ss/, s).replace(/ap/, ap);
};

// tries to resolve ambiguous users by matching login or firstname
// redmine's user search is pretty broad (using login/name/email/etc.) so
// we're trying to just pull it in a bit and get a single user

// name - this should be the name you're trying to match
// data - this is the array of users from redmine

// returns an array with a single user, or the original array if nothing matched
resolveUsers = function(name, data) {
  var found;
  name = name.toLowerCase();
  found = data.filter(function(user) {
    return user.login.toLowerCase() === name;
  });
  if (found.length === 1) {
    return found;
  }
  // try first name
  found = data.filter(function(user) {
    return user.firstname.toLowerCase() === name;
  });
  if (found.length === 1) {
    return found;
  }
  // give up
  return data;
};

// Redmine API Mapping
// This isn't 100% complete, but its the basics for what we would need in campfire
Redmine = class Redmine {
  constructor(url, token) {
    this.url = url;
    this.token = token;
  }

  Users(params, callback) {
    return this.get("/users.json", params, callback);
  }

  User(id) {
    return {
      show: (callback) => {
        return this.get(`/users/${id}.json`, {}, callback);
      }
    };
  }

  Projects(params, callback) {
    return this.get("/projects.json", params, callback);
  }

  Issues(params, callback) {
    return this.get("/issues.json", params, callback);
  }

  Issue(id) {
    return {
      show: (params, callback) => {
        return this.get(`/issues/${id}.json`, params, callback);
      },
      update: (attributes, callback) => {
        return this.put(`/issues/${id}.json`, {
          issue: attributes
        }, callback);
      },
      add: (attributes, callback) => {
        return this.post("/issues.json", {
          issue: attributes
        }, callback);
      }
    };
  }

  TimeEntry(id = null) {
    return {
      create: (attributes, callback) => {
        return this.post("/time_entries.json", {
          time_entry: attributes
        }, callback);
      }
    };
  }

  // Private: do a GET request against the API
  get(path, params, callback) {
    if (params != null) {
      path = `${path}?${QUERY.stringify(params)}`;
    }
    return this.request("GET", path, null, callback);
  }

  // Private: do a POST request against the API
  post(path, body, callback) {
    return this.request("POST", path, body, callback);
  }

  // Private: do a PUT request against the API
  put(path, body, callback) {
    return this.request("PUT", path, body, callback);
  }

  // Private: Perform a request against the redmine REST API
  // from the campfire adapter :)
  request(method, path, body, callback) {
    var endpoint, headers, options, pathname, request;
    headers = {
      "Content-Type": "application/json",
      "X-Redmine-API-Key": this.token
    };
    endpoint = URL.parse(this.url);
    pathname = endpoint.pathname.replace(/^\/$/, '');
    options = {
      "host": endpoint.hostname,
      "port": endpoint.port,
      "path": `${pathname}${path}`,
      "method": method,
      "headers": headers
    };
    if (method === "POST" || method === "PUT") {
      if (typeof body !== "string") {
        body = JSON.stringify(body);
      }
      options.headers["Content-Length"] = body.length;
    }
    request = HTTP.request(options, function(response) {
      var data;
      data = "";
      response.on("data", function(chunk) {
        return data += chunk;
      });
      response.on("end", function() {
        var err;
        switch (response.statusCode) {
          case 200:
            try {
              return callback(null, JSON.parse(data), response.statusCode);
            } catch (error1) {
              err = error1;
              return callback(null, data || {}, response.statusCode);
            }
            break;
          case 401:
            throw new Error("401: Authentication failed.");
          default:
            console.error(`Code: ${response.statusCode}`);
            return callback(null, null, response.statusCode);
        }
      });
      return response.on("error", function(err) {
        console.error(`Redmine response error: ${err}`);
        return callback(err, null, response.statusCode);
      });
    });
    if (method === "POST" || method === "PUT") {
      request.end(body, 'binary');
    } else {
      request.end();
    }
    return request.on("error", function(err) {
      console.error(`Redmine request error: ${err}`);
      return callback(err, null, 0);
    });
  }

};
