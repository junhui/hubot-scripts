// Description:
//   Some interaction with basecamp

// Dependencies:
//   None

// Configuration:
//   HUBOT_BASECAMP_KEY
//   HUBOT_BASECAMP_URL

// Commands:

// Author:
//   fellix
var basecamp_request, print_calendar;

module.exports = function(robot) {
  return robot.hear(/^basecamp calendar( (.*))?$/i, function(msg) {
    var project_name;
    project_name = msg.match[2];
    return basecamp_request(msg, 'projects.json', function(projects) {
      var i, len, project, ref;
      ref = projects.records;
      for (i = 0, len = ref.length; i < len; i++) {
        project = ref[i];
        if (project_name) {
          if (project.name === project_name) {
            print_calendar(msg, project, true);
            return;
          }
        } else {
          print_calendar(msg, project, false);
        }
      }
    });
  });
};

print_calendar = function(msg, project, searching) {
  return basecamp_request(msg, `projects/${project.id}/milestones.json`, function(entries) {
    var i, len, milestone, ref, responsability, results;
    if (entries.count <= 0) {
      if (searching) {
        msg.send(`No milestone found in this project ${project.name}`);
      }
      return;
    }
    ref = entries.records;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      milestone = ref[i];
      if (!milestone.completedOn) {
        responsability = "None";
        if (milestone.responsibleParty) {
          responsability = milestone.responsibleParty.name;
        }
        results.push(msg.send(`[${project.name}] ${milestone.title} -> ${milestone.status}: ${milestone.deadline}, Responsible: ${responsability}`));
      } else {
        results.push(void 0);
      }
    }
    return results;
  });
};

basecamp_request = function(msg, url, handler) {
  var auth, basecamp_key, basecamp_url;
  basecamp_key = `${process.env.HUBOT_BASECAMP_KEY}`;
  auth = new Buffer(`${basecamp_key}:X`).toString('base64');
  basecamp_url = `https://${process.env.HUBOT_BASECAMP_URL}.basecamphq.com`;
  return msg.http(`${basecamp_url}/${url}`).headers({
    Authorization: `Basic ${auth}`,
    Accept: "application/json"
  }).get()(function(err, res, body) {
    var content;
    if (err) {
      msg.send(`Basecamp says: ${err}`);
      return;
    }
    content = JSON.parse(body);
    return handler(content);
  });
};
