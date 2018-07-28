// Description:
//   Messing with the JIRA REST API

// Dependencies:
//   None

// Configuration:
//   HUBOT_JIRA_URL
//   HUBOT_JIRA_USER
//   HUBOT_JIRA_PASSWORD
//   Optional environment variables:
//   HUBOT_JIRA_USE_V2 (defaults to "true", set to "false" for JIRA earlier than 5.0)
//   HUBOT_JIRA_MAXLIST
//   HUBOT_JIRA_ISSUEDELAY
//   HUBOT_JIRA_IGNOREUSERS

// Commands:
//   <Project Key>-<Issue ID> - Displays information about the JIRA ticket (if it exists)
//   hubot show watchers for <Issue Key> - Shows watchers for the given JIRA issue
//   hubot search for <JQL> - Search JIRA with JQL
//   hubot save filter <JQL> as <name> - Save JIRA JQL query as filter in the brain
//   hubot use filter <name> - Use a JIRA filter from the brain
//   hubot show filter(s) - Show all JIRA filters
//   hubot show filter <name> - Show a specific JIRA filter

// Author:
//   codec
var IssueFilter, IssueFilters, RecentIssues;

IssueFilters = class IssueFilters {
  constructor(robot1) {
    this.robot = robot1;
    this.cache = [];
    this.robot.brain.on('loaded', () => {
      var jqls_from_brain;
      jqls_from_brain = this.robot.brain.data.jqls;
      // only overwrite the cache from redis if data exists in redis
      if (jqls_from_brain) {
        return this.cache = jqls_from_brain;
      }
    });
  }

  add(filter) {
    this.cache.push(filter);
    return this.robot.brain.data.jqls = this.cache;
  }

  delete(name) {
    var result;
    result = [];
    this.cache.forEach(function(filter) {
      if (filter.name.toLowerCase() !== name.toLowerCase()) {
        return result.push(filter);
      }
    });
    this.cache = result;
    return this.robot.brain.data.jqls = this.cache;
  }

  get(name) {
    var result;
    result = null;
    this.cache.forEach(function(filter) {
      if (filter.name.toLowerCase() === name.toLowerCase()) {
        return result = filter;
      }
    });
    return result;
  }

  all() {
    return this.cache;
  }

};

IssueFilter = class IssueFilter {
  constructor(name1, jql1) {
    this.name = name1;
    this.jql = jql1;
    return {
      name: this.name,
      jql: this.jql
    };
  }

};

// keeps track of recently displayed issues, to prevent spamming
RecentIssues = class RecentIssues {
  constructor(maxage) {
    this.maxage = maxage;
    this.issues = [];
  }

  cleanup() {
    var age, issue, ref, time;
    ref = this.issues;
    for (issue in ref) {
      time = ref[issue];
      age = Math.round(((new Date()).getTime() - time) / 1000);
      if (age > this.maxage) {
        //console.log 'removing old issue', issue
        delete this.issues[issue];
      }
    }
    return 0;
  }

  contains(issue) {
    this.cleanup();
    return this.issues[issue] != null;
  }

  add(issue, time) {
    time = time || (new Date()).getTime();
    return this.issues[issue] = time;
  }

};

module.exports = function(robot) {
  var filters, get, ignoredusers, info, issuedelay, maxlist, recentissues, search, useV2, watchers;
  filters = new IssueFilters(robot);
  useV2 = process.env.HUBOT_JIRA_USE_V2 !== "false";
  // max number of issues to list during a search
  maxlist = process.env.HUBOT_JIRA_MAXLIST || 10;
  // how long (seconds) to wait between repeating the same JIRA issue link
  issuedelay = process.env.HUBOT_JIRA_ISSUEDELAY || 30;
  // array of users that are ignored
  ignoredusers = (process.env.HUBOT_JIRA_IGNOREUSERS != null ? process.env.HUBOT_JIRA_IGNOREUSERS.split(',') : void 0) || [];
  recentissues = new RecentIssues(issuedelay);
  get = function(msg, where, cb) {
    var authdata, httprequest;
    console.log(process.env.HUBOT_JIRA_URL + "/rest/api/latest/" + where);
    httprequest = msg.http(process.env.HUBOT_JIRA_URL + "/rest/api/latest/" + where);
    if (process.env.HUBOT_JIRA_USER) {
      authdata = new Buffer(process.env.HUBOT_JIRA_USER + ':' + process.env.HUBOT_JIRA_PASSWORD).toString('base64');
      httprequest = httprequest.header('Authorization', 'Basic ' + authdata);
    }
    return httprequest.get()(function(err, res, body) {
      if (err) {
        res.send(`GET failed :( ${err}`);
        return;
      }
      if (res.statusCode === 200) {
        return cb(JSON.parse(body));
      } else {
        console.log("res.statusCode = " + res.statusCode);
        return console.log("body = " + body);
      }
    });
  };
  watchers = function(msg, issue, cb) {
    return get(msg, `issue/${issue}/watchers`, function(watchers) {
      if (watchers.errors != null) {
        return;
      }
      return cb(watchers.watchers.map(function(watcher) {
        return watcher.displayName;
      }).join(", "));
    });
  };
  info = function(msg, issue, cb) {
    return get(msg, `issue/${issue}`, function(issues) {
      if (issues.errors != null) {
        return;
      }
      if (useV2) {
        issue = {
          key: issues.key,
          summary: issues.fields.summary,
          assignee: function() {
            if (issues.fields.assignee !== null) {
              return issues.fields.assignee.displayName;
            } else {
              return "no assignee";
            }
          },
          status: issues.fields.status.name,
          fixVersion: function() {
            if ((issues.fields.fixVersions != null) && issues.fields.fixVersions.length > 0) {
              return issues.fields.fixVersions.map(function(fixVersion) {
                return fixVersion.name;
              }).join(", ");
            } else {
              return "no fix version";
            }
          },
          url: process.env.HUBOT_JIRA_URL + '/browse/' + issues.key
        };
      } else {
        issue = {
          key: issues.key,
          summary: issues.fields.summary.value,
          assignee: function() {
            if (issues.fields.assignee.value !== void 0) {
              return issues.fields.assignee.value.displayName;
            } else {
              return "no assignee";
            }
          },
          status: issues.fields.status.value.name,
          fixVersion: function() {
            if ((issues.fields.fixVersions != null) && issues.fields.fixVersions.value !== void 0) {
              return issues.fields.fixVersions.value.map(function(fixVersion) {
                return fixVersion.name;
              }).join(", ");
            } else {
              return "no fix version";
            }
          },
          url: process.env.HUBOT_JIRA_URL + '/browse/' + issues.key
        };
      }
      return cb(`[${issue.key}] ${issue.summary}. ${issue.assignee()} / ${issue.status}, ${issue.fixVersion()} ${issue.url}`);
    });
  };
  search = function(msg, jql, cb) {
    return get(msg, `search/?jql=${escape(jql)}`, function(result) {
      var resultText;
      if (result.errors != null) {
        return;
      }
      resultText = `I found ${result.total} issues for your search. ${process.env.HUBOT_JIRA_URL}/secure/IssueNavigator.jspa?reset=true&jqlQuery=${escape(jql)}`;
      if (result.issues.length <= maxlist) {
        cb(resultText);
        return result.issues.forEach(function(issue) {
          return info(msg, issue.key, function(info) {
            return cb(info);
          });
        });
      } else {
        return cb(resultText + " (too many to list)");
      }
    });
  };
  robot.respond(/(show )?watchers (for )?(\w+-[0-9]+)/i, function(msg) {
    if (msg.message.user.id === robot.name) {
      return;
    }
    return watchers(msg, msg.match[3], function(text) {
      return msg.send(text);
    });
  });
  robot.respond(/search (for )?(.*)/i, function(msg) {
    if (msg.message.user.id === robot.name) {
      return;
    }
    return search(msg, msg.match[2], function(text) {
      return msg.reply(text);
    });
  });
  robot.respond(/([^\w\-]|^)(\w+-[0-9]+)(?=[^\w]|$)/ig, function(msg) {
    var i, len, matched, ref, results, ticket;
    if (msg.message.user.id === robot.name) {
      return;
    }
    if (ignoredusers.some(function(user) {
      return user === msg.message.user.name;
    })) {
      console.log('ignoring user due to blacklist:', msg.message.user.name);
      return;
    }
    ref = msg.match;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      matched = ref[i];
      ticket = (matched.match(/(\w+-[0-9]+)/))[0];
      if (!recentissues.contains(msg.message.user.room + ticket)) {
        info(msg, ticket, function(text) {
          return msg.send(text);
        });
        results.push(recentissues.add(msg.message.user.room + ticket));
      } else {
        results.push(void 0);
      }
    }
    return results;
  });
  robot.respond(/save filter (.*) as (.*)/i, function(msg) {
    var filter;
    filter = filters.get(msg.match[2]);
    if (filter) {
      filters.delete(filter.name);
      msg.reply(`Updated filter ${filter.name} for you`);
    }
    filter = new IssueFilter(msg.match[2], msg.match[1]);
    return filters.add(filter);
  });
  robot.respond(/delete filter (.*)/i, function(msg) {
    return filters.delete(msg.match[1]);
  });
  robot.respond(/(use )?filter (.*)/i, function(msg) {
    var filter, name;
    name = msg.match[2];
    filter = filters.get(name);
    if (!filter) {
      msg.reply(`Sorry, could not find filter ${name}`);
      return;
    }
    return search(msg, filter.jql, function(text) {
      return msg.reply(text);
    });
  });
  return robot.respond(/(show )?filter(s)? ?(.*)?/i, function(msg) {
    var filter;
    if (filters.all().length === 0) {
      msg.reply("Sorry, I don't remember any filters.");
      return;
    }
    if (msg.match[3] === void 0) {
      msg.reply(`I remember ${(filters.all().length)} filters`);
      return filters.all().forEach(function(filter) {
        return msg.reply(`${filter.name}: ${filter.jql}`);
      });
    } else {
      filter = filters.get(msg.match[3]);
      return msg.reply(`${filter.name}: ${filter.jql}`);
    }
  });
};
