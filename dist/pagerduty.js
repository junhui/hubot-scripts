// Description:
//   PagerDuty integration for checking who's on call, making exceptions, ack, resolve, etc.

// Commands:

//   hubot who's on call - return the username of who's on call
//   hubot pager me trigger <msg> - create a new incident with <msg>
//   hubot pager me 60 - take the pager for 60 minutes
//   hubot pager me as <email> - remember your pager email is <email>
//   hubot pager me incidents - return the current incidents
//   hubot pager me incident NNN - return the incident NNN
//   hubot pager me note <incident> <content> - add note to incident #<incident> with <content>
//   hubot pager me notes <incident> - show notes for incident #<incident>
//   hubot pager me problems - return all open incidents
//   hubot pager me ack <incident> - ack incident #<incident>
//   hubot pager me ack <incident1> <incident2> ... <incidentN> - ack all specified incidents
//   hubot pager me ack - ack all triggered incidents 
//   hubot pager me resolve <incident> - resolve incident #<incident>
//   hubot pager me resolve <incident1> <incident2> ... <incidentN>- resolve all specified incidents
//   hubot pager me resolve - resolve all acknowledged incidents

// Dependencies:
//  "moment": "1.6.2"

// Notes: 
//   To setup the webhooks and get the alerts in your chatrooms, you need to add the endpoint you define here (e.g /hooks) in 
//   the service settings of your PagerDuty accounts. You also need to define the room in which you want them to appear. 
//   (Unless you want to spam all the rooms with alerts, but we don't believe that should be the default behavior :)  

// URLs: 
//   http://developer.pagerduty.com/documentation/rest/webhooks
//   http://support.pagerduty.com/entries/21774694-Webhooks-

// Configuration:

//   HUBOT_PAGERDUTY_API_KEY - API Access Key
//   HUBOT_PAGERDUTY_SUBDOMAIN
//   HUBOT_PAGERDUTY_SERVICE_API_KEY - Service API Key from a 'General API Service'
//   HUBOT_PAGERDUTY_SCHEDULE_ID
//   HUBOT_PAGERDUTY_ROOM - Room in which you want the PagerDuty webhook notifications to appear
//   HUBOT_PAGERDUTY_ENDPOINT - PagerDuty webhook listener e.g /hook

// Authors: 
//   Jesse Newland, Josh Nicols, Jacob Bednarz, Chris Lundquist, Chris Streeter, Joseph Pierri, Greg Hoin

var inspect, moment, pagerDutyApiKey, pagerDutyBaseUrl, pagerDutyScheduleId, pagerDutyServiceApiKey, pagerDutySubdomain, pagerEndpoint, pagerRoom;

inspect = require('util').inspect;

moment = require('moment');

pagerDutyApiKey = process.env.HUBOT_PAGERDUTY_API_KEY;

pagerDutySubdomain = process.env.HUBOT_PAGERDUTY_SUBDOMAIN;

pagerDutyBaseUrl = `https://${pagerDutySubdomain}.pagerduty.com/api/v1`;

pagerDutyServiceApiKey = process.env.HUBOT_PAGERDUTY_SERVICE_API_KEY;

pagerDutyScheduleId = process.env.HUBOT_PAGERDUTY_SCHEDULE_ID;

pagerRoom = process.env.HUBOT_PAGERDUTY_ROOM;

// Webhook listener endpoint. Set it to whatever URL you want, and make sure it matches your pagerduty service settings 
pagerEndpoint = process.env.HUBOT_PAGERDUTY_ENDPOINT || "/hook";

module.exports = function(robot) {
  var formatIncident, generateIncidentString, getUserForIncident, missingEnvironmentForApi, pagerDutyGet, pagerDutyIncident, pagerDutyIncidents, pagerDutyIntegrationAPI, pagerDutyIntergrationPost, pagerDutyPost, pagerDutyPut, parseIncidentNumbers, parseIncidents, parseWebhook, updateIncidents, withCurrentOncall, withPagerDutyUser;
  robot.respond(/pager( me)?$/i, function(msg) {
    var cmd, cmds;
    if (missingEnvironmentForApi(msg)) {
      return;
    }
    withPagerDutyUser(msg, function(user) {
      var emailNote;
      emailNote = msg.message.user.pagerdutyEmail ? `You've told me your PagerDuty email is ${msg.message.user.pagerdutyEmail}` : msg.message.user.email_address ? `I'm assuming your PagerDuty email is ${msg.message.user.email_address}. Change it with \`${robot.name} pager me as you@yourdomain.com\`` : void 0;
      if (user) {
        return msg.send(`I found your PagerDuty user https://${pagerDutySubdomain}.pagerduty.com${user.user_url}, ${emailNote}`);
      } else {
        return msg.send(`I couldn't find your user :( ${emailNote}`);
      }
    });
    cmds = robot.helpCommands();
    cmds = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = cmds.length; i < len; i++) {
        cmd = cmds[i];
        if (cmd.match(/(pager me |who's on call)/)) {
          results.push(cmd);
        }
      }
      return results;
    })();
    return msg.send(cmds.join("\n"));
  });
  robot.respond(/pager(?: me)? as (.*)$/i, function(msg) {
    var email;
    email = msg.match[1];
    msg.message.user.pagerdutyEmail = email;
    return msg.send(`Okay, I'll remember your PagerDuty email is ${email}`);
  });
  // Assumes your Campfire usernames and PagerDuty names are identical
  robot.respond(/pager( me)? (\d+)/i, function(msg) {
    return withPagerDutyUser(msg, function(user) {
      var end, minutes, override, start, userId;
      userId = user.id;
      if (!userId) {
        return;
      }
      start = moment().format();
      minutes = parseInt(msg.match[2]);
      end = moment().add('minutes', minutes).format();
      override = {
        'start': start,
        'end': end,
        'user_id': userId
      };
      return withCurrentOncall(msg, function(old_username) {
        var data;
        data = {
          'override': override
        };
        return pagerDutyPost(msg, `/schedules/${pagerDutyScheduleId}/overrides`, data, function(json) {
          if (json.override) {
            start = moment(json.override.start);
            end = moment(json.override.end);
            return msg.send(`Rejoice, ${old_username}! ${json.override.user.name} has the pager until ${end.format()}`);
          }
        });
      });
    });
  });
  robot.respond(/(pager|major)( me)? incident (.*)$/, function(msg) {
    return pagerDutyIncident(msg, msg.match[3], function(incident) {
      return msg.send(formatIncident(incident));
    });
  });
  robot.respond(/(pager|major)( me)? (inc|incidents|sup|problems)$/i, function(msg) {
    return pagerDutyIncidents(msg, "triggered,acknowledged", function(incidents) {
      var buffer, incident, junk, ref, ref1;
      if (incidents.length > 0) {
        buffer = "Triggered:\n----------\n";
        ref = incidents.reverse();
        for (junk in ref) {
          incident = ref[junk];
          if (incident.status === 'triggered') {
            buffer = buffer + formatIncident(incident);
          }
        }
        buffer = buffer + "\nAcknowledged:\n-------------\n";
        ref1 = incidents.reverse();
        for (junk in ref1) {
          incident = ref1[junk];
          if (incident.status === 'acknowledged') {
            buffer = buffer + formatIncident(incident);
          }
        }
        return msg.send(buffer);
      } else {
        return msg.send("No open incidents");
      }
    });
  });
  robot.respond(/(pager|major)( me)? (?:trigger|page) (.+)$/i, function(msg) {
    var description, reason, user;
    user = msg.message.user.name;
    reason = msg.match[3];
    description = `${reason} - @${user}`;
    return pagerDutyIntegrationAPI(msg, "trigger", description, function(json) {
      return msg.reply(`${json.status}, key: ${json.incident_key}`);
    });
  });
  robot.respond(/(?:pager|major)(?: me)? ack(?:nowledge)? (.+)$/i, function(msg) {
    var incidentNumbers;
    incidentNumbers = parseIncidentNumbers(msg.match[1]);
    // only acknowledge triggered things, since it doesn't make sense to re-acknowledge if it's already in re-acknowledge
    // if it ever doesn't need acknowledge again, it means it's timed out and has become 'triggered' again anyways
    return updateIncidents(msg, incidentNumbers, 'triggered,acknowledged', 'acknowledged');
  });
  robot.respond(/(pager|major)( me)? ack(nowledge)?$/i, function(msg) {
    return pagerDutyIncidents(msg, 'triggered,acknwowledged', function(incidents) {
      var incident, incidentNumbers;
      incidentNumbers = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = incidents.length; i < len; i++) {
          incident = incidents[i];
          results.push(incident.incident_number);
        }
        return results;
      })();
      if (incidentNumbers.length < 1) {
        msg.send("Nothing to acknowledge");
        return;
      }
      // only acknowledge triggered things
      return updateIncidents(msg, incidentNumbers, 'triggered,acknowledged', 'acknowledged');
    });
  });
  robot.respond(/(?:pager|major)(?: me)? res(?:olve)?(?:d)? (.+)$/i, function(msg) {
    var incidentNumbers;
    incidentNumbers = parseIncidentNumbers(msg.match[1]);
    // allow resolving of triggered and acknowedlge, since being explicit
    return updateIncidents(msg, incidentNumbers, 'triggered,acknowledged', 'resolved');
  });
  robot.respond(/(pager|major)( me)? res(olve)?(d)?$/i, function(msg) {
    return pagerDutyIncidents(msg, "acknowledged", function(incidents) {
      var incident, incidentNumbers;
      incidentNumbers = (function() {
        var i, len, results;
        results = [];
        for (i = 0, len = incidents.length; i < len; i++) {
          incident = incidents[i];
          results.push(incident.incident_number);
        }
        return results;
      })();
      if (incidentNumbers.length < 1) {
        msg.send("Nothing to resolve");
        return;
      }
      // only resolve things that are acknowledged 
      return updateIncidents(msg, incidentNumbers, 'acknowledged', 'resolved');
    });
  });
  robot.respond(/(pager|major)( me)? notes (.+)$/i, function(msg) {
    var incidentId;
    incidentId = msg.match[3];
    return pagerDutyGet(msg, `/incidents/${incidentId}/notes`, {}, function(json) {
      var buffer, i, len, note, ref;
      buffer = "";
      ref = json.notes;
      for (i = 0, len = ref.length; i < len; i++) {
        note = ref[i];
        buffer += `${note.created_at} ${note.user.name}: ${note.content}\n`;
      }
      return msg.send(buffer);
    });
  });
  robot.respond(/(pager|major)( me)? note ([\d\w]+) (.+)$/i, function(msg) {
    var content, incidentId;
    incidentId = msg.match[3];
    content = msg.match[4];
    return withPagerDutyUser(msg, function(user) {
      var data, userId;
      userId = user.id;
      if (!userId) {
        return;
      }
      data = {
        note: {
          content: content
        },
        requester_id: userId
      };
      return pagerDutyPost(msg, `/incidents/${incidentId}/notes`, data, function(json) {
        if (json && json.note) {
          return msg.send(`Got it! Note created: ${json.note.content}`);
        } else {
          return msg.send("Sorry, I couldn't do it :(");
        }
      });
    });
  });
  // who is on call?
  robot.respond(/who('s|s| is)? (on call|oncall)/i, function(msg) {
    return withCurrentOncall(msg, function(username) {
      return msg.reply(`${username} is on call`);
    });
  });
  parseIncidentNumbers = function(match) {
    return match.split(/[ ,]+/).map(function(incidentNumber) {
      return parseInt(incidentNumber);
    });
  };
  missingEnvironmentForApi = function(msg) {
    var missingAnything;
    missingAnything = false;
    if (pagerDutySubdomain == null) {
      msg.send("PagerDuty Subdomain is missing:  Ensure that HUBOT_PAGERDUTY_SUBDOMAIN is set.");
      missingAnything |= true;
    }
    if (pagerDutyApiKey == null) {
      msg.send("PagerDuty API Key is missing:  Ensure that HUBOT_PAGERDUTY_API_KEY is set.");
      missingAnything |= true;
    }
    if (pagerDutyScheduleId == null) {
      msg.send("PagerDuty Schedule ID is missing:  Ensure that HUBOT_PAGERDUTY_SCHEDULE_ID is set.");
      missingAnything |= true;
    }
    return missingAnything;
  };
  withPagerDutyUser = function(msg, cb) {
    var email;
    email = msg.message.user.pagerdutyEmail || msg.message.user.email_address;
    if (!email) {
      msg.send(`Sorry, I can't figure out your email address :( Can you tell me with \`${robot.name} pager me as you@yourdomain.com\`?`);
      return;
    }
    return pagerDutyGet(msg, "/users", {
      query: email
    }, function(json) {
      if (json.users.length !== 1) {
        msg.send(`Sorry, I expected to get 1 user back for ${email}, but got ${json.users.length} :sweat:`);
        return;
      }
      return cb(json.users[0]);
    });
  };
  pagerDutyGet = function(msg, url, query, cb) {
    var auth;
    if (missingEnvironmentForApi(msg)) {
      return;
    }
    auth = `Token token=${pagerDutyApiKey}`;
    return msg.http(pagerDutyBaseUrl + url).query(query).headers({
      Authorization: auth,
      Accept: 'application/json'
    }).get()(function(err, res, body) {
      var json_body;
      json_body = null;
      switch (res.statusCode) {
        case 200:
          json_body = JSON.parse(body);
          break;
        default:
          console.log(res.statusCode);
          console.log(body);
          json_body = null;
      }
      return cb(json_body);
    });
  };
  pagerDutyPut = function(msg, url, data, cb) {
    var auth, json;
    if (missingEnvironmentForApi(msg)) {
      return;
    }
    json = JSON.stringify(data);
    auth = `Token token=${pagerDutyApiKey}`;
    return msg.http(pagerDutyBaseUrl + url).headers({
      Authorization: auth,
      Accept: 'application/json'
    }).header("content-type", "application/json").header("content-length", json.length).put(json)(function(err, res, body) {
      var json_body;
      json_body = null;
      switch (res.statusCode) {
        case 200:
          json_body = JSON.parse(body);
          break;
        default:
          console.log(res.statusCode);
          console.log(body);
          json_body = null;
      }
      return cb(json_body);
    });
  };
  pagerDutyPost = function(msg, url, data, cb) {
    var auth, json;
    if (missingEnvironmentForApi(msg)) {
      return;
    }
    json = JSON.stringify(data);
    auth = `Token token=${pagerDutyApiKey}`;
    return msg.http(pagerDutyBaseUrl + url).headers({
      Authorization: auth,
      Accept: 'application/json'
    }).header("content-type", "application/json").header("content-length", json.length).post(json)(function(err, res, body) {
      var json_body;
      json_body = null;
      switch (res.statusCode) {
        case 201:
          json_body = JSON.parse(body);
          break;
        default:
          console.log(res.statusCode);
          console.log(body);
          json_body = null;
      }
      return cb(json_body);
    });
  };
  withCurrentOncall = function(msg, cb) {
    var now, oneHour, query;
    oneHour = moment().add('hours', 1).format();
    now = moment().format();
    query = {
      since: now,
      until: oneHour,
      overflow: 'true'
    };
    return pagerDutyGet(msg, `/schedules/${pagerDutyScheduleId}/entries`, query, function(json) {
      if (json.entries && json.entries.length > 0) {
        return cb(json.entries[0].user.name);
      }
    });
  };
  pagerDutyIncident = function(msg, incident, cb) {
    return pagerDutyGet(msg, `/incidents/${encodeURIComponent(incident)}`, {}, function(json) {
      return cb(json);
    });
  };
  pagerDutyIncidents = function(msg, status, cb) {
    var query;
    query = {
      status: status,
      sort_by: "incident_number:asc"
    };
    return pagerDutyGet(msg, "/incidents", query, function(json) {
      return cb(json.incidents);
    });
  };
  pagerDutyIntegrationAPI = function(msg, cmd, description, cb) {
    var data;
    if (pagerDutyServiceApiKey == null) {
      msg.send("PagerDuty API service key is missing.");
      msg.send("Ensure that HUBOT_PAGERDUTY_SERVICE_API_KEY is set.");
      return;
    }
    data = null;
    switch (cmd) {
      case "trigger":
        data = JSON.stringify({
          service_key: pagerDutyServiceApiKey,
          event_type: "trigger",
          description: description
        });
        return pagerDutyIntergrationPost(msg, data, function(json) {
          return cb(json);
        });
    }
  };
  formatIncident = function(inc) {
    var assigned_to, summary;
    // { pd_nagios_object: 'service',
    //   HOSTNAME: 'fs1a',
    //   SERVICEDESC: 'snapshot_repositories',
    //   SERVICESTATE: 'CRITICAL',
    //   HOSTSTATE: 'UP' },
    // email services
    summary = inc.trigger_summary_data ? inc.trigger_summary_data.subject ? inc.trigger_summary_data.subject : inc.trigger_summary_data.description ? inc.trigger_summary_data.description : inc.trigger_summary_data.pd_nagios_object === 'service' ? `${inc.trigger_summary_data.HOSTNAME}/${inc.trigger_summary_data.SERVICEDESC}` : inc.trigger_summary_data.pd_nagios_object === 'host' ? `${inc.trigger_summary_data.HOSTNAME}/${inc.trigger_summary_data.HOSTSTATE}` : "" : "";
    assigned_to = inc.assigned_to_user ? `- assigned to ${inc.assigned_to_user.name}` : "";
    return `${inc.incident_number}: ${inc.created_on} ${summary} ${assigned_to}\n`;
  };
  updateIncidents = function(msg, incidentNumbers, statusFilter, updatedStatus) {
    return withPagerDutyUser(msg, function(user) {
      var requesterId;
      requesterId = user.id;
      if (!requesterId) {
        return;
      }
      return pagerDutyIncidents(msg, statusFilter, function(incidents) {
        var data, foundIncidents, i, incident, len;
        foundIncidents = [];
        for (i = 0, len = incidents.length; i < len; i++) {
          incident = incidents[i];
          // FIXME this isn't working very consistently
          if (incidentNumbers.indexOf(incident.incident_number) > -1) {
            foundIncidents.push(incident);
          }
        }
        if (foundIncidents.length === 0) {
          return msg.reply(`Couldn't find incidents ${incidentNumbers.join(', ')} in ${inspect(incidents)}`);
        } else {
          // loljson
          data = {
            requester_id: requesterId,
            incidents: foundIncidents.map(function(incident) {
              return {
                'id': incident.id,
                'status': updatedStatus
              };
            })
          };
          return pagerDutyPut(msg, "/incidents", data, function(json) {
            var buffer;
            if (json != null ? json.incidents : void 0) {
              buffer = "Incident";
              if (json.incidents.length > 1) {
                buffer += "s";
              }
              buffer += " ";
              buffer += ((function() {
                var j, len1, ref, results;
                ref = json.incidents;
                results = [];
                for (j = 0, len1 = ref.length; j < len1; j++) {
                  incident = ref[j];
                  results.push(incident.incident_number);
                }
                return results;
              })()).join(", ");
              buffer += ` ${updatedStatus}`;
              return msg.reply(buffer);
            } else {
              return msg.reply(`Problem updating incidents ${incidentNumbers.join(',')}`);
            }
          });
        }
      });
    });
  };
  pagerDutyIntergrationPost = function(msg, json, cb) {
    return msg.http('https://events.pagerduty.com/generic/2010-04-15/create_event.json').header("content-type", "application/json").header("content-length", json.length).post(json)(function(err, res, body) {
      switch (res.statusCode) {
        case 200:
          json = JSON.parse(body);
          return cb(json);
        default:
          console.log(res.statusCode);
          return console.log(body);
      }
    });
  };
  
  // Pagerduty Webhook Integration (For a payload example, see http://developer.pagerduty.com/documentation/rest/webhooks)
  parseWebhook = function(req, res) {
    var hook, messages;
    hook = req.body;
    messages = hook.messages;
    if (/^incident.*$/.test(messages[0].type)) {
      return parseIncidents(messages);
    } else {
      return "No incidents in webhook";
    }
  };
  getUserForIncident = function(incident) {
    if (incident.assigned_to_user) {
      return incident.assigned_to_user.email;
    } else if (incident.resolved_by_user) {
      return incident.resolved_by_user.email;
    } else {
      return '(???)';
    }
  };
  generateIncidentString = function(incident, hookType) {
    console.log("hookType is " + hookType);
    if (hookType === "incident.trigger") {
      return `Incident # ${incident.incident_number} :\n${incident.status} and assigned to ${getUserForIncident(incident)}\n ${incident.html_url}\nTo acknowledge: @${robot.name} pager me ack ${incident.incident_number}\n To resolve: @${robot.name} pager me resolve ${incident.incident_number}`;
    } else if (hookType === "incident.acknowledge") {
      return `Incident # ${incident.incident_number} :\n${incident.status} and assigned to ${getUserForIncident(incident)}\n ${incident.html_url}\nTo resolve: @${robot.name} pager me resolve ${incident.incident_number}`;
    } else if (hookType === "incident.resolve") {
      return `Incident # ${incident.incident_number} has been resolved by ${getUserForIncident(incident)}\n ${incident.html_url}`;
    } else if (hookType === "incident.unacknowledge") {
      return `${incident.status} , unacknowledged and assigned to ${getUserForIncident(incident)}\n ${incident.html_url}\nTo acknowledge: @${robot.name} pager me ack ${incident.incident_number}\n To resolve: @${robot.name} pager me resolve ${incident.incident_number}`;
    } else if (hookType === "incident.assign") {
      return `Incident # ${incident.incident_number} :\n${incident.status} , reassigned to ${getUserForIncident(incident)}\n ${incident.html_url}\nTo resolve: @${robot.name} pager me resolve ${incident.incident_number}`;
    } else if (hookType === "incident.escalate") {
      return `Incident # ${incident.incident_number} :\n${incident.status} , was escalated and assigned to ${getUserForIncident(incident)}\n ${incident.html_url}\nTo acknowledge: @${robot.name} pager me ack ${incident.incident_number}\n To resolve: @${robot.name} pager me resolve ${incident.incident_number}`;
    }
  };
  parseIncidents = function(messages) {
    var count, hookType, i, incident, len, message, returnMessage;
    returnMessage = [];
    count = 0;
    for (i = 0, len = messages.length; i < len; i++) {
      message = messages[i];
      incident = message.data.incident;
      hookType = message.type;
      returnMessage.push(generateIncidentString(incident, hookType));
      count = count + 1;
    }
    returnMessage.unshift("You have " + count + " PagerDuty update(s): \n");
    return returnMessage.join("\n");
  };
  // Webhook listener
  if (pagerEndpoint && pagerRoom) {
    return robot.router.post(pagerEndpoint, function(req, res) {
      robot.messageRoom(pagerRoom, parseWebhook(req, res));
      return res.end();
    });
  }
};
