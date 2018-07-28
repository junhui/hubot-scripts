// Description:
//   Allows Hubot to interact with Harvest's (http://harvestapp.com) time-tracking
//   service.

// Dependencies:
//   None
// Configuration:
//   HUBOT_HARVEST_SUBDOMAIN

// Commands:

//   hubot remember my harvest account <email> with password <password> - Make hubot remember your Harvest credentials
//   hubot forget my harvest account - Make hubot forget your Harvest credentials again
//   hubot start harvest - Restart the last timer.
//   hubot start harvest at <project>/<task>: <notes> - Start a Harvest timer at a given project-task combination
//   hubot stop harvest [at project/task] - Stop the most recent Harvest timer or the one for the given project-task combination.
//   hubot daily harvest [of <user>] [at yyyy-mm-dd] - Show a user's Harvest timers for today (or yours, if noone is specified) or a specific day
//   hubot list harvest tasks [of <user>] - Show the Harvest project-task combinations available to a user (or you, if noone is specified)
//   hubot is harvest down/up - Check if the Harvest API is reachable.

// Notes:
//   All commands and command arguments are case-insenitive. If you work
//   on a project "FooBar", hubot will unterstand "foobar" as well. This
//   is also true for abbreviations, so if you don't have similary named
//   projects, "foob" will do as expected.

//   Some examples:
//   > hubot remember my harvest account joe@example.org with password doe
//   > hubot list harvest tasks
//   > hubot start harvest at myproject/important-task: Some notes go here.
//   > hubot start harvest at myp/imp: Some notes go here.
//   > hubot daily harvest of nickofotheruser

//   Full command descriptions:

//   hubot remember my harvest account <email> with password <password>
//     Saves your Harvest credentials to allow Hubot to track
//     time for you.

//   hubot forget my harvest account
//     Deletes your account credentials from Hubt's memory.

//  hubot start harvest
//    Examines the list of timers for today and creates a new timer with
//    the same properties as the most recent one.

//   hubot start harvest at <project>/<task>: <notes>
//     Starts a timer for a task at a project (both of which may
//     be abbreviated, Hubot will ask you if your input is
//     ambigious). An existing timer (if any) will be stopped.

//   hubot stop harvest [at <project>/<task>]
//     Stops the timer for a task, if any. If no project is given,
//     stops the first active timer it can find. The project and
//     task arguments may be abbreviated as with start.

//   hubot daily harvest [of <user>] [on yyyy-mm-dd]
//     Hubot responds with your/a specific user's entries
//     for the given date; if no date is given, assumes today.
//     If user is ommitted, you are assumed; if both the user and
//     the date are ommited, your entries for today will be displayed.

//   hubot list harvest tasks [of <user>]
//     Gives you a list of all project/task combinations available
//     to you or a specific user. You can use these for the start command.

//   Note on HUBOT_HARVEST_SUBDOMAIN:
//     This is the subdomain you access the Harvest service with, e.g.
//     if you have the Harvest URL http://yourcompany.harvestapp.com
//     you should set this to "yourcompany" (without the quotes).

// Author:
//   Quintus @ Asquera

var HarvestAccount, HarvestService, check_harvest_down, check_user, http;

http = require("http");

if (!process.env.HUBOT_HARVEST_SUBDOMAIN) {
  console.log("Please set HUBOT_HARVEST_SUBDOMAIN in the environment to use the harvest plugin script.");
}

// Checks if we have the information necessary for making requests
// for a user. If we don't, reply accordingly and return null. Otherwise,
// return the user object.
// If `test_user` is supplied, checks the credentials for the user
// with that name, otherwise the sender of `msg` is checked.
check_user = function(robot, msg, test_user = null) {
  var user;
  // Detect the user; if none is passed, assume the sender.
  user = null;
  if (test_user) {
    user = robot.brain.userForName(test_user);
    if (!user) {
      msg.reply(`${msg.match[2]}? Whoʼs that?`);
      return null;
    }
  } else {
    user = msg.message.user;
  }
  
  // Check if we know the detected user's credentials.
  if (!user.harvest_account) {
    if (user === msg.message.user) {
      msg.reply("You have to tell me your Harvest credentials first.");
    } else {
      msg.reply(`I didnʼt crack ${user.name}ʼs Harvest credentials yet, but Iʼm working on it… Sorry for the inconvenience.`);
    }
    return null;
  }
  return user;
};

// Issues an empty GET request to harvest to test whether the service is
// available at the moment. The callback gets passed an exception object
// describing the connection error; if everything is fine it gets passed
// null.
check_harvest_down = function(callback) {
  var opts, req;
  opts = {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    method: "GET",
    host: `${process.env.HUBOT_HARVEST_SUBDOMAIN}.harvestapp.com`,
    port: 80,
    path: "/account/who_am_i"
  };
  req = http.request(opts, function(response) {
    return callback(null);
  });
  req.on("error", function(error) {
    return callback(error);
  });
  req.setTimeout(5000, function() {
    req.destroy(); // Cancel the request
    return callback("Connection timeout");
  });
  return req.end();
};

/* Definitions for hubot */
module.exports = function(robot) {
  var cb;
  // Periodically check the Harvest service for availability
  cb = function() {
    return check_harvest_down(function(error) {
      if (error) {
        return robot.send("broadcast", `Harvest appears to be down; exact error is: ${error}`);
      }
    });
  };
  setInterval(cb, 600000); // 10 Minutes in milliseconds
  
  // Check if Harvest is available.
  robot.respond(/is harvest (down|up)/i, function(msg) {
    return check_harvest_down(function(error) {
      if (error) {
        return msg.reply(`Harvest is down; exact error: ${error}`);
      } else {
        return msg.reply("Harvest is up.");
      }
    });
  });
  // Provide facility for saving the account credentials.
  robot.respond(/remember my harvest account (.+) with password (.+)/i, function(msg) {
    var account, error, harvest;
    account = new HarvestAccount(msg.match[1], msg.match[2]);
    harvest = new HarvestService(account);
    try {
      // If the credentials are valid, remember them, otherwise
      // tell the user they are wrong.
      return harvest.test(msg, function(valid) {
        if (valid) {
          msg.message.user.harvest_account = account;
          return msg.reply("Thanks, Iʼll remember your credentials. Have fun with Harvest.");
        } else {
          return msg.reply("Uh-oh – I just tested your credentials, but they appear to be wrong. Please specify the correct ones.");
        }
      });
    } catch (error1) {
      error = error1;
      return msg.reply(`Unable to test credentials: fatal error: ${error}`);
    }
  });
  // Allows a user to delete his credentials.
  robot.respond(/forget my harvest account/i, function(msg) {
    msg.message.user.harvest_account = null;
    return msg.reply("Okay, I erased your credentials from my memory.");
  });
  // Retrieve your or a specific user's timesheet for today.
  robot.respond(/daily harvest( of (\w+))?( on (\d{4})-(\d{2})-(\d{2}))?/i, function(msg) {
    var error, harvest, target_date, user;
    if (!(user = check_user(robot, msg, msg.match[2]))) {
      return;
    }
    harvest = new HarvestService(user.harvest_account);
    if (msg.match[3]) {
      target_date = new Date(parseInt(msg.match[4]), parseInt(msg.match[5] - 1), parseInt(msg.match[6]));
    }
    try {
      if (target_date) {
        return harvest.daily_at(msg, target_date, function(status, body) {
          var entry, i, len, ref, results;
          if ((200 <= status && status <= 299)) {
            if (body.day_entries.length === 0) {
              msg.reply(`${user.name} has no entries on ${target_date}.`);
            } else {
              msg.reply(`${user.name}'s entries on ${target_date}:`);
            }
            ref = body.day_entries;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              entry = ref[i];
              if (entry.ended_at === "") {
                results.push(msg.reply(`• ${entry.project} (${entry.client}) → ${entry.task} <${entry.notes}> [running since ${entry.started_at} (${entry.hours}h)]`));
              } else {
                results.push(msg.reply(`• ${entry.project} (${entry.client}) → ${entry.task} <${entry.notes}> [${entry.started_at} – ${entry.ended_at} (${entry.hours}h)]`));
              }
            }
            return results;
          } else {
            return msg.reply(`Failed to retrieve entry information: request failed with status ${status}.`);
          }
        });
      } else {
        return harvest.daily(msg, function(status, body) {
          var entry, i, len, ref, results;
          if ((200 <= status && status <= 299)) {
            msg.reply(`Your entries for today, ${user.name}:`);
            ref = body.day_entries;
            results = [];
            for (i = 0, len = ref.length; i < len; i++) {
              entry = ref[i];
              if (entry.ended_at === "") {
                results.push(msg.reply(`• ${entry.project} (${entry.client}) → ${entry.task} <${entry.notes}> [running since ${entry.started_at} (${entry.hours}h)]`));
              } else {
                results.push(msg.reply(`• ${entry.project} (${entry.client}) → ${entry.task} <${entry.notes}> [${entry.started_at} – ${entry.ended_at} (${entry.hours}h)]`));
              }
            }
            return results;
          } else {
            return msg.reply(`Failed to retrieve entry information: request failed with status ${status}.`);
          }
        });
      }
    } catch (error1) {
      error = error1;
      return msg.reply(`Failed to retrieve entry information: fatal error: ${error}`);
    }
  });
  // List all project/task combinations that are available to a user.
  robot.respond(/list harvest tasks( of (.+))?/i, function(msg) {
    var error, harvest, user;
    if (!(user = check_user(robot, msg, msg.match[2]))) {
      return;
    }
    harvest = new HarvestService(user.harvest_account);
    try {
      return harvest.daily(msg, function(status, body) {
        var i, len, project, ref, results, task;
        if ((200 <= status && status <= 299)) {
          msg.reply(`The following project/task combinations are available for you, ${user.name}:`);
          ref = body.projects;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            project = ref[i];
            msg.reply(`• Project ${project.name}`);
            results.push((function() {
              var j, len1, ref1, results1;
              ref1 = project.tasks;
              results1 = [];
              for (j = 0, len1 = ref1.length; j < len1; j++) {
                task = ref1[j];
                results1.push(msg.reply(`  ‣ ${task.name} (${(task.billable ? 'billable' : 'non-billable')})`));
              }
              return results1;
            })());
          }
          return results;
        } else {
          return msg.reply(`Failed to retrieve project/task list: request failed with status ${status}.`);
        }
      });
    } catch (error1) {
      error = error1;
      return msg.reply(`Failed to retrieve project/task list: fatal error: ${error}`);
    }
  });
  // Kick off a new timer, stopping the previously running one, if any.
  robot.respond(/start harvest at (.+)\/(.+): (.*)/i, function(msg) {
    var error, harvest, notes, project, task, user;
    if (!(user = check_user(robot, msg))) {
      return;
    }
    harvest = new HarvestService(user.harvest_account);
    project = msg.match[1];
    task = msg.match[2];
    notes = msg.match[3];
    try {
      return harvest.start(msg, project, task, notes, function(status, body) {
        if ((200 <= status && status <= 299)) {
          if (body.hours_for_previously_running_timer != null) {
            msg.reply(`Previously running timer stopped at ${body.hours_for_previously_running_timer}h.`);
          }
          return msg.reply(`OK, I started tracking you on ${body.project}/${body.task}.`);
        } else {
          return msg.reply(`Failed to start timer: request failed with status ${status}.`);
        }
      });
    } catch (error1) {
      error = error1;
      return msg.reply(`Failed to start timer: fatal error: ${error}`);
    }
  });
  robot.respond(/start harvest$/i, function(msg) {
    var error, harvest, user;
    if (!(user = check_user(robot, msg))) {
      return;
    }
    harvest = new HarvestService(user.harvest_account);
    try {
      return harvest.restart(msg, function(status, body) {
        if ((200 <= status && status <= 299)) {
          if (body.hours_for_previously_running_timer != null) {
            msg.reply(`Previously running timer stopped at ${body.hours_for_previously_running_timer}h.`);
          }
          return msg.reply(`OK, I started tracking you on ${body.project}/${body.task}.`);
        } else {
          return msg.reply(`Failed to start timer: request failed with status ${status}.`);
        }
      });
    } catch (error1) {
      error = error1;
      return msg.reply(`Failed to start timer: fatal error: ${error}`);
    }
  });
  // Stops the timer running for a project/task combination,
  // if any. If no combination is given, stops the first
  // active timer available.
  return robot.respond(/stop harvest( at (.+)\/(.+))?/i, function(msg) {
    var error, harvest, project, task, user;
    if (!(user = check_user(robot, msg))) {
      return;
    }
    harvest = new HarvestService(user.harvest_account);
    if (msg.match[1]) {
      project = msg.match[2];
      task = msg.match[3];
      try {
        return harvest.stop(msg, project, task, function(status, body) {
          if ((200 <= status && status <= 299)) {
            return msg.reply(`Timer stopped (${body.hours}h).`);
          } else {
            msg.reply(`Failed to stop timer: request failed with status ${status}.`);
            return msg.reply(body);
          }
        });
      } catch (error1) {
        error = error1;
        return msg.reply(`Failed to stop timer: fatal error: ${error}`);
      }
    } else {
      try {
        return harvest.stop_first(msg, function(status, body) {
          if ((200 <= status && status <= 299)) {
            return msg.reply(`Timer stopped (${body.hours}h).`);
          } else {
            return msg.reply(`Failed to stop timer: request failed with status ${status}.`);
          }
        });
      } catch (error1) {
        error = error1;
        return msg.reply(`Failed to stop timer: fatal error: ${error}`);
      }
    }
  });
};

// Class encapsulating a user's Harvest credentials; safe to store
// in Hubot's Redis brain (no methods, this is a data-only construct).
HarvestAccount = class HarvestAccount {
  // Create a new harvest account. Pass in the account's email and the
  // password used to access harvest. These credentials are the same you
  // use for logging into Harvest's web service.
  constructor(email, password) {
    this.email = email;
    this.password = password;
  }

};

// This class represents a user's connection to the Harvest API;
// it is bound to a specific account and cannot be stored permanently
// in Hubot's (Redis) brain.

// The API calls are asynchronous, i.e. the methods executing
// the request immediately return. To process the response,
// you have to attach a callback to the method call, which
// unless documtened otherwise will receive two arguments,
// the first being the response's status code, the second
// one is the response's body as a JavaScript object created
// via `JSON.parse`.
HarvestService = class HarvestService {
  // Creates a new connection to the Harvest API for the given
  // account.
  constructor(account) {
    this.base_url = `https://${process.env.HUBOT_HARVEST_SUBDOMAIN}.harvestapp.com`;
    this.account = account;
  }

  
  // Tests whether the account credentials are valid.
  // If so, the callback gets passed `true`, otherwise
  // it gets passed `false`.
  test(msg, callback) {
    return this.request(msg).path("account/who_am_i").get()(function(err, res, body) {
      var ref;
      if ((200 <= (ref = res.statusCode) && ref <= 299)) {
        return callback(true);
      } else {
        return callback(false);
      }
    });
  }

  // Issues /daily to the Harvest API.
  daily(msg, callback) {
    return this.request(msg).path("/daily").get()(function(err, res, body) {
      var ref;
      if ((200 <= (ref = res.statusCode) && ref <= 299)) {
        return callback(res.statusCode, JSON.parse(body));
      } else {
        return callback(res.statusCode, null);
      }
    });
  }

  // Issues /daily/<dayofyear>/<year> to the Harvest API.
  daily_at(msg, date, callback) {
    return this.request(msg).path(`/daily/${this.day_of_year(date)}/${date.getFullYear()}`).get()(function(err, res, body) {
      var ref;
      if ((200 <= (ref = res.statusCode) && ref <= 299)) {
        return callback(res.statusCode, JSON.parse(body));
      } else {
        return callback(res.statusCode, null);
      }
    });
  }

  restart(msg, callback) {
    return this.daily(msg, (status, body) => {
      var data, last_entry;
      if ((200 <= status && status <= 299)) {
        if (body.day_entries.length === 0) {
          return msg.reply("No last entry to restart, sorry.");
        } else {
          last_entry = body.day_entries.pop();
          data = {
            notes: last_entry.notes,
            project_id: last_entry.project_id,
            task_id: last_entry.task_id
          };
          return this.request(msg).path("/daily/add").post(JSON.stringify(data))(function(err, res, body) {
            var ref;
            if ((200 <= (ref = res.statusCode) && ref <= 299)) {
              return callback(res.statusCode, JSON.parse(body));
            } else {
              return callback(res.statusCode, null);
            }
          });
        }
      } else {
        return callback(status, null);
      }
    });
  }

  // Issues /daily/add to the Harvest API to add a new timer
  // starting from now.
  start(msg, target_project, target_task, notes, callback) {
    return this.find_project_and_task(msg, target_project, target_task, (project, task) => {
      var data;
      // OK, task and project found. Start the tracker.
      data = {
        notes: notes,
        project_id: project.id,
        task_id: task.id
      };
      return this.request(msg).path("/daily/add").post(JSON.stringify(data))(function(err, res, body) {
        var ref;
        if ((200 <= (ref = res.statusCode) && ref <= 299)) {
          return callback(res.statusCode, JSON.parse(body));
        } else {
          return callback(res.statusCode, null);
        }
      });
    });
  }

  // Issues /daily/timer/<id> to the Harvest API to stop
  // the timer running at `entry.id`. If that timer isn't
  // running, replys accordingly, otherwise calls the callback
  // when the operation has finished.
  stop_entry(msg, entry, callback) {
    if (entry.timer_started_at != null) {
      return this.request(msg).path(`/daily/timer/${entry.id}`).get()(function(err, res, body) {
        var ref;
        if ((200 <= (ref = res.statusCode) && ref <= 299)) {
          return callback(res.statusCode, JSON.parse(body));
        } else {
          return callback(res.statusCode, null);
        }
      });
    } else {
      return msg.reply("This timer is not running.");
    }
  }

  // Issues /daily/timer/<id> to the Harvest API to stop
  // the timer running at <id>, which is determined by
  // looking up the current day_entry for the given
  // project/task combination. If no entry is found (i.e.
  // no timer has been started for this combination today),
  // replies with an error message and doesn't executes the
  // callback.
  stop(msg, target_project, target_task, callback) {
    return this.find_day_entry(msg, target_project, target_task, (entry) => {
      return this.stop_entry(msg, entry, function(status, body) {
        return callback(status, body);
      });
    });
  }

  // Issues /daily/timer/<id> to the Harvest API to stop
  // the timer running at <id>, which is the first active
  // timer it can find in today's timesheet, then calls the
  // callback. If no active timer is found, replies accordingly
  // and doesn't execute the callback.
  stop_first(msg, callback) {
    return this.daily(msg, (status, body) => {
      var entry, found_entry, i, len, ref;
      found_entry = null;
      ref = body.day_entries;
      for (i = 0, len = ref.length; i < len; i++) {
        entry = ref[i];
        if (entry.timer_started_at != null) {
          found_entry = entry;
          break;
        }
      }
      if (found_entry != null) {
        return this.stop_entry(msg, found_entry, function(status, body) {
          return callback(status, body);
        });
      } else {
        return msg.reply("Currently there is no timer running.");
      }
    });
  }

  // (internal method)
  // Assembles the basic parts of a request to the Harvest
  // API, i.e. the Content-Type/Accept and authorization
  // headers. The returned HTTPClient object can (and should)
  // be customized further by calling path() and other methods
  // on it.
  request(msg) {
    var req;
    req = msg.http(this.base_url).headers({
      "Content-Type": "application/json",
      "Accept": "application/json"
    }).auth(this.account.email, this.account.password);
    return req;
  }

  // (internal method)
  // Searches through all projects available to the sender of
  // `msg` for a project whose name inclues `target_project`.
  // If exactly one is found, query all tasks available for the
  // sender in this projects, and if exactly one is found,
  // execute the callback with the project object as the first
  // and the task object as the second argument. If more or
  // less than one project or task are found to match the query,
  // reply accordingly to the user (the callback never gets
  // executed in this case).
  find_project_and_task(msg, target_project, target_task, callback) {
    return this.daily(msg, function(status, body) {
      var i, j, k, l, len, len1, len2, len3, project, projects, ref, ref1, task, tasks;
      // Search through all possible projects for the matching ones
      projects = [];
      ref = body.projects;
      for (i = 0, len = ref.length; i < len; i++) {
        project = ref[i];
        if (project.name.toLowerCase().indexOf(target_project.toLowerCase()) !== -1) {
          projects.push(project);
        }
      }
      // Ask the user if the project name is ambivalent
      if (projects.length === 0) {
        msg.reply("Sorry, no matching projects found.");
        return;
      } else if (projects.length > 1) {
        msg.reply(`I found the following ${projects.length} projects for your query, please be more precise:`);
        for (j = 0, len1 = projects.length; j < len1; j++) {
          project = projects[j];
          msg.reply(`• ${project.name}`);
        }
        return;
      }
      // Repeat the same process for the tasks
      tasks = [];
      ref1 = projects[0].tasks;
      for (k = 0, len2 = ref1.length; k < len2; k++) {
        task = ref1[k];
        if (task.name.toLowerCase().indexOf(target_task.toLowerCase()) !== -1) {
          tasks.push(task);
        }
      }
      if (tasks.length === 0) {
        msg.reply("Sorry, no matching tasks found.");
      } else if (tasks.length > 1) {
        msg.reply(`I found the following ${tasks.length} tasks for your query, please be more pricese:`);
        for (l = 0, len3 = tasks.length; l < len3; l++) {
          task = tasks[l];
          msg.reply(`• ${task.name}`);
        }
        return;
      }
      // Execute the callback with the results
      return callback(projects[0], tasks[0]);
    });
  }

  // (internal method)
  // Searches through all entries made for today and tries
  // to find a running timer for the given project/task
  // combination.
  // If it is found, the respective entry object is passed to
  // the callback, otherwise an error message is replied and
  // the callback doesn't get executed.
  find_day_entry(msg, target_project, target_task, callback) {
    return this.find_project_and_task(msg, target_project, target_task, (project, task) => {
      return this.daily(msg, function(status, body) {
        var entry, found_entry, i, len, project_id, ref, task_id;
        // For some unknown reason, the daily entry IDs are strings
        // instead of numbers, causing the comparison below to fail.
        // So, convert our target stuff to strings as well.
        project_id = `${project.id}`;
        task_id = `${task.id}`;
        // Iterate through all available entries for today
        // and try to find the requested ID.
        found_entry = null;
        ref = body.day_entries;
        for (i = 0, len = ref.length; i < len; i++) {
          entry = ref[i];
          if (entry.project_id === project_id && entry.task_id === task_id && (entry.timer_started_at != null)) {
            found_entry = entry;
            break;
          }
        }
        // None found
        if (found_entry == null) {
          msg.reply(`I couldnʼt find a running timer in todayʼs timesheet for the combination ${target_project}/${target_task}.`);
          return;
        }
        // Execute the callback with the result
        return callback(found_entry);
      });
    });
  }

  // Takes a Date object and figures out which day in its
  // year it represents and returns that one. Leap years
  // are honoured.
  day_of_year(date) {
    var start;
    start = new Date(date.getFullYear(), 0, 0);
    return Math.ceil((date - start) / 86400000);
  }

};
