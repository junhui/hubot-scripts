// Description:
//   Allows Hubot to start and stop project time in mite.yo.lk

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot save my mite key <key> for <account> - stores your personal API key for mite.yo.lk
//   hubot mite me <task> on <project> - starts or stops the matched task on the given project in mite.yo.lk

// Author:
//   canclini
var Mite;

module.exports = function(robot) {
  robot.respond(/mite( me)? (.+) on (.+)/i, function(msg) { // user wants to track time
    var mite, mite_account, mite_key, project, task, user_mite;
    [task, project] = msg.match.slice(2, 4);
    user_mite = msg.message.user.mite;
    if (!((user_mite != null) && user_mite.length === 2)) { // exit if the credentials are not provided
      msg.reply("sorry, you first have to tell me your credentials.");
      return;
    }
    [mite_key, mite_account] = user_mite.slice(0, 2);
    mite = new Mite(msg, mite_key, mite_account); // create a new Mite instance
    return mite.projects(msg, project, function(projects) { // first get the project information
      var answer, result;
      if (projects.length === 0) { // no projects found
        msg.reply("Oops.. could not find a matching project");
        return;
      }
      if (projects.length > 1) { // more than one project found
        answer = `please be more precise, I found ${projects.length} projects: `;
        result = (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = projects.length; i < len; i++) {
            project = projects[i];
            results.push(project.project.name);
          }
          return results;
        })();
        answer += result.join(", ");
        msg.reply(answer); // list the found projects and..
        // .. exit
        return;
      }
      project = projects[0].project; // the first and only project is used
      return mite.services(msg, task, function(services) { // then get the task
        var service;
        if (services.length === 0) {
          msg.reply("Oops.. could not find a matching task");
          return;
        }
        if (services.length > 1) {
          answer = `please be more precise, I found ${services.length} tasks: `;
          result = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = services.length; i < len; i++) {
              service = services[i];
              results.push(service.service.name);
            }
            return results;
          })();
          answer += result.join(", ");
          msg.reply(answer);
          return;
        }
        service = services[0].service;
        // check if there is alreday a good time entry for today
        return mite.todays_matching_entry(msg, project, service, function(time_entry) {
          if (time_entry != null) {
            return mite.tracker(msg, time_entry); // we start the timer on this one again
          } else {
            return mite.time_entry(msg, project, service, function(time_entry) { // create a new entry for this projects task
              return mite.tracker(msg, time_entry); // start the tracker on the time entry
            }); // if there is an existing time entry for today...
          }
        });
      });
    });
  });
  
  // we need to know the key to connect to mite.yo.lk
  return robot.respond(/save my mite key (.+) for (.+)/i, function(msg) {
    var mite_account, mite_key, user;
    mite_key = msg.match[1];
    mite_account = msg.match[2];
    user = msg.message.user; // for this user
    user.mite = [
      mite_key,
      mite_account // and in the Brain it goes
    ];
    return msg.reply("I'll hapilly punch your timecard from now on.");
  });
};

// MITE CLASS #
Mite = class Mite {
  constructor(msg, key, account) {
    this.url = `http://${account}.mite.yo.lk`;
    this.key = key;
  }

  services(msg, task, callback) {
    return msg.http(this.url).headers({
      'X-MiteApiKey': `${this.key}`,
      'Accept': 'application/json'
    }).query({
      name: task
    }).path("services").get()(function(err, res, body) {
      if (err) {
        msg.reply(`Mite says: ${err}`);
        return;
      }
      return callback(JSON.parse(body));
    });
  }

  projects(msg, project, callback) {
    return msg.http(this.url).headers({
      'X-MiteApiKey': `${this.key}`,
      'Accept': 'application/json'
    }).query({
      name: project
    }).path("projects").get()(function(err, res, body) {
      if (err) {
        msg.reply(`Mite says: ${err}`);
        return;
      }
      return callback(JSON.parse(body));
    });
  }

  time_entry(msg, project, service, callback) {
    var data;
    data = JSON.stringify({
      time_entry: {
        service_id: `${service.id}`,
        project_id: `${project.id}`
      }
    });
    return msg.http(this.url).headers({
      'X-MiteApiKey': `${this.key}`,
      'Content-type': "application/json",
      'Accept': 'application/json'
    }).path("time_entries").post(data)(function(err, res, body) {
      var time_entries;
      if (err) {
        msg.reply(`Mite says: ${err}`);
        return;
      }
      time_entries = JSON.parse(body);
      return callback(time_entries.time_entry);
    });
  }

  todays_matching_entry(msg, project, service, callback) {
    return msg.http(this.url).headers({
      'X-MiteApiKey': `${this.key}`,
      'Accept': 'application/json'
    }).query({
      name: project
    }).path("daily").get()(function(err, res, body) {
      var t_entries, time_entries, time_entry;
      if (err) {
        msg.reply(`Mite says: ${err}`);
        return;
      }
      time_entries = JSON.parse(body);
      time_entry = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = time_entries.length; i < len; i++) {
          t_entries = time_entries[i];
          if (t_entries.time_entry.project_id === project.id && t_entries.time_entry.service_id === service.id) {
            results.push(t_entries.time_entry);
          }
        }
        return results;
      })();
      return callback(time_entry[0]);
    });
  }

  tracker(msg, time_entry) {
    return msg.http(this.url).headers({
      'X-MiteApiKey': `${this.key}`,
      'Content-type': "application/json",
      'Accept': 'application/json'
    }).path(`tracker/${time_entry.id}`).put(" ")(function(err, res, body) {
      if (err) {
        msg.reply(`Mite says: ${err}`);
        return;
      }
      return msg.reply("ok, time is running...");
    });
  }

};
