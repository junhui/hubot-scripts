// Description:
//   Octospy GitHub events, watch what's happening with your projects
//   Powered by http://developer.github.com/v3/repos/hooks/

// Dependencies:
//   "underscore": "1.3.3"
//   "handlebars": "1.0.5beta"

// Configuration:
//   HUBOT_URL
//   HUBOT_GITHUB_USER
//   HUBOT_GITHUB_PASSWORD
//   or
//   HUBOT_GITHUB_TOKEN

// Commands:
//   hubot octospy <repo> [event_type] - Start watching events for the repo, default push
//   hubot octospy stop <repo> [event_type] - Stop watching events for the repo
//   hubot octospying - Show what you're spying on
//   hubot octospy events - List the events you can watch

// Author:
//   rcs
var Handlebars, QS, _, pubsub_modify, renderTemplate, views;

_ = require('underscore');

QS = require('querystring');

Handlebars = require('handlebars');

Handlebars.registerHelper('trim', function(str, length) {
  return str.substring(0, length);
});

Handlebars.registerHelper('overflow', function(str, length) {
  if (str.length > length) {
    return str.substring(0, length - 3) + '...';
  } else {
    return str;
  }
});

// Internal: Given a template name and a context, return the compiled template.
// Returns JSONed context if no template is found.

// event   - The event type we're rendering
// context - The object to give the template

// If the template in the views hash is a function, pass it the context to get the specific template
renderTemplate = function(event, context) {
  var message, template;
  if (views[event]) {
    if (_.isFunction(views[event])) {
      message = views[event](context);
    } else {
      template = Handlebars.compile(views[event]);
      message = template(context);
    }
  } else {
    // We couldn't find a template, so let's push this out. People on github like JSON, right?
    message = {};
    message[event] = req.body;
    message = JSON.stringify(message);
  }
  return message;
};

// Private: Helper method for pubsub modification.

// msg    - The hubot msg object, used for its http client
// action - The action to take, 'subscribe' or 'unsubscribe'
// target - The hash containing the subscription we want to work on
//          github_url - The base github URL
//          repo       - The repository
//          event      - The event type
// cb     - Function to pass as a callback to the HTTP call

// Example:

// pubsub_modify(msg, 'subscribe', { github_url: 'github.com', repo: 'github/hubot', event: 'push' }, (err,resp,body) -> msg.send "aaaaaallllright.")

pubsub_modify = function(msg, action, target, cb) {
  var auth, data, event, github_url, repo;
  ({github_url, repo, event} = target);
  data = QS.stringify({
    "hub.mode": action,
    "hub.topic": `https://${github_url}/${repo}/events/${event}.json`,
    "hub.callback": `${process.env.HUBOT_URL}/hubot/octospy/${github_url}/${event}`
  });
  // Check authentication, return error if it isn't specified
  if (process.env.HUBOT_GITHUB_TOKEN) {
    auth = `token ${process.env.HUBOT_GITHUB_TOKEN}`;
  } else if (process.env.HUBOT_GITHUB_USER && process.env.HUBOT_GITHUB_PASSWORD) {
    auth = 'Basic ' + new Buffer(`${process.env.HUBOT_GITHUB_USER}:${process.env.HUBOT_GITHUB_PASSWORD}`).toString('base64');
  } else {
    return cb({}, {
      statusCode: 401
    }, {
      message: "Octospy doesn't have credentials"
    });
  }
  return msg.http(`https://api.${github_url}`).path('/hub').header('Authorization', auth).post(data)(cb);
};

// These are views for each of the event types.
// Note: Handlebars likes to HTML escape things. It's kinda lame as a default. {{{ }}} to avoid it.
views = {
  push: function(context) {
    var message, template;
    if (context.created) {
      template = "{{pusher.name}} created a new branch \"{{branch}}\" on {{repo_name}} {{compare}}";
    } else {
      if (context.commits.length > 3) {
        context.extra_commits = context.commits.length - 3;
      }
      context.short_commits = context.commits.slice(0, 3);
      template = "{{pusher.name}} pushed to {{branch}} at {{repo_name}} {{compare}}\n{{#each short_commits}}  {{author.username}}: {{trim id 7}} {{{overflow message 80}}}\n{{/each}}{{#if extra_commits }}  ... +{{extra_commits}} more{{/if}}";
    }
    template = Handlebars.compile(template);
    return message = template(context);
  },
  issues: "{{sender.login}} {{action}} issue {{issue.number}} on {{repo_name}} \"{{{overflow issue.title 25}}}\" {{issue.html_url}}",
  issue_comment: "{{sender.login}} commented on issue {{issue.number}} on {{repo_name}} \"{{{overflow issue.title 25}}}\" {{issue.html_url}}\n> {{{overflow comment.body 120}}}",
  commit_comment: "{{sender.login}} commented on commit {{comment.commit_id}} on {{repo_name}} {{comment.html_url}}\n> {{{overflow comment.body 120}}}",
  pull_request: function(context) {
    var message, template;
    template = (function() {
      switch (context.action) {
        case 'opened':
          return "{{sender.login}} {{action}} pull request {{number}} on {{repo_name}}: \"{{{overflow pull_request.title 25}}}\" {{pull_request.html_url}}\n{{pull_request.commits}} commits with {{pull_request.additions}} additions and {{pull_request.deletions}} deletions";
        case 'closed':
          switch (context.pull_request.merged) {
            case true:
              return "{{sender.login}} merged pull request {{number}} on {{repo_name}}: \"{{{overflow pull_request.title 25}}}\" {{pull_request.html_url}}";
            default:
              return "{{sender.login}} closed pull request {{number}} on {{repo_name}} without merging: \"{{{overflow pull_request.title 25}}}\" {{pull_request.html_url}}";
          }
          break;
        case 'synchronize':
          return "{{sender.login}} updated pull request {{number}} on {{repo_name}}: \"{{{overflow pull_request.title 25}}}\" {{pull_request.html_url}}";
      }
    })();
    template = Handlebars.compile(template);
    return message = template(context);
  },
  pull_request_review_comment: "{{sender.login}} commented on pull request {{pull_request.number}} on {{repo_name}} \"{{{overflow pull_request.title 25}}}\" {{pull_request.html_url}}\n> {{{overflow comment.body 120}}}",
  gollum: "{{#each pages}}\n  {{../sender.login}} {{action}} wiki page on {{repo_name}}: \"{{{overflow title 25}}}\" {{html_url}}\n{{/each}}",
  watch: "{{sender.login}} started watching {{repo_name}} http://{{github_url}}/{{sender.login}}",
  download: "{{sender.login}} added a download to {{repo_name}}: \"{{{overflow download.name 25}}}\" {{download.html_url}}",
  fork: "{{sender.login}} forked {{repo_name}} {{forkee.html_url}}",
  fork_apply: "{{sender.login}} merged from the fork queue to {{head}} on {{repo_name}}",
  member: "{{sender.login}} added {{member.login}} as a collaborator to {{repo_name}}",
  public: "{{sender.login}} turned {{repo_name}} public"
};

module.exports = function(robot) {
  // Internal: Initialize our brain
  robot.brain.on('loaded', () => {
    var base;
    return (base = robot.brain.data).octospy || (base.octospy = {});
  });
  // Public: Announce the kinds of things octospy knows about
  robot.respond(/octospy events/i, function(msg) {
    var event;
    return msg.reply("I know about " + ((function() {
      var results;
      results = [];
      for (event in views) {
        results.push(event);
      }
      return results;
    })()).join(', '));
  });
  // Public: Dump the watching hash
  robot.respond(/octospying/i, function(msg) {
    var event, github, github_url, listeners, ref, repo, repo_name, sub, watching;
    watching = [];
    ref = robot.brain.data.octospy;
    // Troll octospy's data for any possible listeners, then see if they're us
    for (github_url in ref) {
      github = ref[github_url];
      for (repo_name in github) {
        repo = github[repo_name];
        for (event in repo) {
          listeners = repo[event];
          if (_.include(listeners, msg.message.user.id)) {
            watching.push({
              github_url: github_url,
              repo_name: repo_name,
              event: event
            });
          }
        }
      }
    }
    if (watching.length > 0) {
      return msg.reply((function() {
        var j, len, results;
        results = [];
        for (j = 0, len = watching.length; j < len; j++) {
          sub = watching[j];
          results.push(`${sub.repo_name} ${sub.event} events` + (sub.github_url !== 'github.com' ? ` on ${sub.github_url}` : ""));
        }
        return results;
      })());
    } else {
      return msg.reply("I don't think you're octospying anything");
    }
  });
  // Public: Unsubscribe from an event type for a repository

  // repo       - The repository name (ex. 'github/hubot'
  // event      - The event type to stop watching (default: 'push')
  // github_url - The base github URL (default: 'github.com'
  robot.respond(/octospy stop ([^ ]+\/[^ ]+) ?([^ ]*)? ?([^ ]*)?/i, function(msg) {
    var event, github_url, i, j, len, listener, listeners, ref, ref1, removed, repo;
    repo = msg.match[1];
    event = msg.match[2] || 'push';
    github_url = msg.match[3] || 'github.com';
    // Convenience accessor
    listeners = (ref = robot.brain.data.octospy[github_url]) != null ? (ref1 = ref[repo]) != null ? ref1[event] : void 0 : void 0;
    if (!listeners) {
      return msg.send(`Can't find any octospies for ${repo} ${event} events`);
    }
// Find the user in possible listeners
    for (i = j = 0, len = listeners.length; j < len; i = ++j) {
      listener = listeners[i];
      if (listener === msg.message.user.id) {
        removed = listeners.splice(i, 1);
      }
    }
    if (!removed) {
      return msg.reply(`I don't think you're octospying ${repo} ${event} events`);
    } else {
      msg.reply(`Unoctospied ${repo} ${event} events on ${github_url}`);
    }
    // We're done if nobody's left
    if (listeners.length !== 0) {
      return;
    }
    // Otherwise we unsub
    return pubsub_modify(msg, 'unsubscribe', {
      github_url: github_url,
      repo: repo,
      event: event
    }, function(err, res, body) {
      var a, data, events, repos;
      switch (res.statusCode) {
        case 204:
          data = robot.brain.data.octospy;
          repos = data[github_url];
          events = repos[repo];
          // Clean up after ourselves
          delete events[event];
          if (((function() {
            var results;
            results = [];
            for (a in events) {
              results.push(a);
            }
            return results;
          })()).length === 0) {
            delete repos[repo];
          }
          if (((function() {
            var results;
            results = [];
            for (a in repos) {
              results.push(a);
            }
            return results;
          })()).length === 0) {
            delete data[github_url];
          }
          // Here to hook the redis magic
          // robot.brain.data.octospy = data
          return robot.logger.info(`The last user unsubscribed. Removed my subscription to ${repo} ${event} events`);
        default:
          return robot.logger.warning(`Failed to unsubscribe to ${repo} ${event} events on ${github_url}: ${body} (Status Code: ${res.statusCode})`);
      }
    });
  });
  // Public: Subsribe to an event type for a repository

  // repo       - The repository name (ex. 'github/hubot'
  // event      - The event type to stop watching (default: 'push')
  // github_url - The base github URL (default: 'github.com'
  robot.respond(/octospy ([^ ]+\/[^ ]+) ?([^ ]*)? ?([^ ]*)?/i, function(msg) {
    var addListener, event, github_url, known, listeners, ref, ref1, repo;
    repo = msg.match[1];
    event = msg.match[2] || 'push';
    github_url = msg.match[3] || 'github.com';
    if (!_.include((function() {
      var results;
      results = [];
      for (known in views) {
        results.push(known);
      }
      return results;
    })(), event)) {
      return msg.reply(`Sorry, I don't know about ${event} events`);
    }
    // Convenience accessor
    listeners = (ref = robot.brain.data.octospy[github_url]) != null ? (ref1 = ref[repo]) != null ? ref1[event] : void 0 : void 0;
    // Internal: Add a listener

    // Closes around msg, repo, event, github_url
    addListener = function() {
      var base, events, listener, repos;
      // Vivify!
      repos = (base = robot.brain.data.octospy)[github_url] || (base[github_url] = {});
      events = repos[repo] || (repos[repo] = {});
      listeners = events[event] || (events[event] = []);
      if (((function() {
        var j, len, results;
        results = [];
        for (j = 0, len = listeners.length; j < len; j++) {
          listener = listeners[j];
          if (listener === msg.message.user.id) {
            // See whether we're already listening
            results.push(listener);
          }
        }
        return results;
      })()).length === 0) {
        listeners.push(msg.message.user.id);
        return msg.reply(`Octospying ${repo} ${event} events on ${github_url}`);
      } else {
        return msg.reply("You're already octospying that.");
      }
    };
    if (!listeners) {
      return pubsub_modify(msg, 'subscribe', {
        github_url: github_url,
        repo: repo,
        event: event
      }, function(err, res, body) {
        switch (res.statusCode) {
          case 204:
            return addListener();
          case 401:
            return msg.reply(`Failed to auth: ${JSON.stringify(body)}\nSpecify credentials in the environment. (HUBOT_GITHUB_USERNAME,HUBOT_GITHUB_PASSWORD) or HUBOT_GITHUB_TOKEN"\nTo create a token: curl -u 'user:pass' https://api.github.com/authorizations -d '{"scopes":["repo"],"note":"Hubot Octospy"}'`);
          case 422:
            msg.reply(`Either ${repo} doesn't exist, or my credentials don't make me a collaborator on it. Couldn't subscribe.`);
            return robot.logger.info(`${JSON.stringify(body)}`);
          default:
            msg.reply(`I failed to subscribe to ${repo} ${event} events on ${github_url}: ${body} (Status Code: ${res.statusCode})`);
            return robot.logger.warning(`${JSON.stringify(body)}`);
        }
      });
    } else {
      return addListener();
    }
  });
  // Public: Repond to POSTs from github

  // :github - The github base url we registered, so we know the source of this POST
  // :event  - The event type that was registered
  return robot.router.post('/hubot/octospy/:github/:event', function(req, res) {
    var context, event, github_url, id, j, len, listeners, message, ref, ref1, repo_name, room, user, users;
    req.body = req.body || {};
    if (!req.body.repository) { // Not something we care about. Who does this?
      return res.end("ok");
    }
    
    // Convenience accessors
    event = req.params.event;
    repo_name = (req.body.repository.owner.login || req.body.repository.owner.name) + "/" + req.body.repository.name;
    github_url = req.params.github;
    // Extend the context for our templates
    context = _.extend(req.body, {
      repo: req.body.repository,
      repo_name: repo_name,
      github_url: github_url,
      branch: req.body.ref ? req.body.ref.replace(/^refs\/heads\//, '') : void 0
    });
    message = '[octospy] ' + renderTemplate(event, context);
    // Tell the people who care
    listeners = (function() {
      var j, len, ref, ref1, results;
      ref1 = ((ref = robot.brain.data.octospy[github_url]) != null ? ref[repo_name][event] : void 0) || [];
      results = [];
      for (j = 0, len = ref1.length; j < len; j++) {
        id = ref1[j];
        results.push(robot.brain.userForId(id));
      }
      return results;
    })();
    ref = _.groupBy(listeners, 'room');
    // group rooms together, so we don't spam with multiple people with subs
    for (room in ref) {
      users = ref[room];
      if (room) {
        robot.send(users[0], message);
      }
    }
    ref1 = _.groupBy(listeners, 'room');
    // For users without rooms, send individually
    for (room in ref1) {
      users = ref1[room];
      if (!room) {
        for (j = 0, len = users.length; j < len; j++) {
          user = users[j];
          robot.send(user, message);
        }
      }
    }
    res.writeHead(204);
    return res.end();
  });
};
