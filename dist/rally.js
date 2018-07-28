// Description:
//   Rally information for artifacts

// Dependencies:
//   None

// Configuration:
//   HUBOT_RALLY_USERNAME
//   HUBOT_RALLY_PASSWORD

// Commands:
//   hubot rally me <formattedID> - Lookup a task, story, defect, etc. from Rally

// Notes:
//   Since Rally supports rich text for description fields, it will come back as HTML
//   to pretty print this we can run it through lynx. Make sure you have lynx installed
//   and PATH accessible, otherwise we will degrade to just showing the html description.

// Author:
//   brianmichel
var api_version, basicAuthRequest, exec, getLinkToItem, labeledField, logger, pass, prettifyDescription, queryRequest, rallyRequest, refObjectName, stripHtml, typeInfoByPrefix, user;

exec = require('child_process').exec;

user = process.env.HUBOT_RALLY_USERNAME;

pass = process.env.HUBOT_RALLY_PASSWORD;

api_version = 'v2.0';

logger = null;

typeInfoByPrefix = {
  DE: {
    name: 'defect',
    extraOutputFields: ['State', 'ScheduleState', 'Severity']
  },
  DS: {
    name: 'defectsuite',
    extraOutputFields: ['ScheduleState']
  },
  F: {
    name: 'feature',
    queryName: 'portfolioitem/feature',
    linkName: 'portfolioitem/feature',
    extraOutputFields: ['State._refObjectName', 'Parent._refObjectName']
  },
  I: {
    name: 'initiative',
    queryName: 'portfolioitem/initiative',
    linkName: 'portfolioitem/initiative',
    extraOutputFields: ['State._refObjectName', 'Parent._refObjectName']
  },
  T: {
    name: 'theme',
    queryName: 'portfolioitem/theme',
    linkName: 'portfolioitem/theme',
    extraOutputFields: ['State._refObjectName', 'Parent._refObjectName']
  },
  TA: {
    name: 'task',
    extraOutputFields: ['State', 'WorkProduct._refObjectName']
  },
  TC: {
    name: 'testcase',
    extraOutputFields: ['WorkProduct._refObjectName', 'Type']
  },
  US: {
    name: 'story',
    queryName: 'hierarchicalrequirement',
    linkName: 'userstory',
    extraOutputFields: ['ScheduleState', 'Parent._refObjectName', 'Feature._refObjectName']
  }
};

module.exports = function(robot) {
  logger = robot.logger;
  return robot.respond(/(rally)( me)? ([a-z]+)(\d+)/i, function(msg) {
    var idNumber, idPrefix;
    if (user && pass) {
      idPrefix = msg.match[3].toUpperCase();
      idNumber = msg.match[4];
      if (typeInfoByPrefix.hasOwnProperty(idPrefix)) {
        return queryRequest(msg, typeInfoByPrefix[idPrefix], idNumber, function(string) {
          return msg.send(string);
        });
      } else {
        return msg.send("Uhh, I don't know that formatted ID prefix");
      }
    } else {
      return msg.send('You need to set HUBOT_RALLY_USERNAME & HUBOT_RALLY_PASSWORD before making requests!');
    }
  });
};

queryRequest = function(msg, typeInfo, idNumber, cb) {
  var queryName, queryString;
  queryName = typeInfo.queryName || typeInfo.name;
  queryString = `/${queryName}.js?query=(FormattedID = ${idNumber})&fetch=true`;
  return rallyRequest(msg, queryString, function(json) {
    var description, linkName, result;
    if (json && json.QueryResult.TotalResultCount > 0) {
      result = json.QueryResult.Results[0];
      linkName = typeInfo.linkName || typeInfo.name;
      getLinkToItem(msg, result, linkName);
      description = 'No Description';
      return prettifyDescription(result.Description, function(output) {
        var field, i, len, ref, returnArray;
        description = output || description;
        returnArray = [`${result.FormattedID} - ${result.Name}`, labeledField(result, 'Owner._refObjectName'), labeledField(result, 'Project._refObjectName')];
        ref = typeInfo.extraOutputFields;
        for (i = 0, len = ref.length; i < len; i++) {
          field = ref[i];
          returnArray.push(labeledField(result, field));
        }
        returnArray.push("Description:");
        returnArray.push(`${description}`);
        return cb(returnArray.join("\n"));
      });
    } else {
      return cb(`Aww snap, I couldn't find that ${typeInfo.name}!`);
    }
  });
};

labeledField = function(result, field) {
  var match;
  match = field.match(/^(\w+)\._refObjectName$/);
  if (match) {
    return `${match[1]}: ${refObjectName(result, match[1])}`;
  } else {
    return `${field}: ${result[field]}`;
  }
};

refObjectName = function(result, field) {
  if (result[field]) {
    return result[field]._refObjectName;
  } else {
    return `No ${field}`;
  }
};

rallyRequest = function(msg, query, cb) {
  var rally_url;
  rally_url = 'https://rally1.rallydev.com/slm/webservice/' + api_version + query;
  //  logger.debug "rally_url = #{rally_url}"
  return basicAuthRequest(msg, rally_url, function(json) {
    //    if json
    //      logger.debug "json = #{JSON.stringify(json)}"
    return cb(json);
  });
};

basicAuthRequest = function(msg, url, cb) {
  var auth;
  auth = 'Basic ' + new Buffer(user + ':' + pass).toString('base64');
  return msg.http(url).headers({
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
        json_body = null;
    }
    return cb(json_body);
  });
};

getLinkToItem = function(msg, object, type) {
  var jsPos, lastSlashPos, objectId, project, projectId;
  project = object && object.Project ? object.Project : null;
  if (project) {
    objectId = object.ObjectID;
    jsPos = project._ref.lastIndexOf('.js');
    lastSlashPos = project._ref.lastIndexOf('/');
    projectId = project._ref.slice((lastSlashPos + 1), +(jsPos) + 1 || 9e9);
    return msg.send(`https://rally1.rallydev.com/#/${projectId}/detail/${type}/${objectId}`);
  } else {

  }
};

//do nothing
stripHtml = function(html, cb) {
  var return_text;
  return_text = html.replace(/<style.+\/style>/g, '');
  return_text = return_text.replace(/<br ?\/?>/g, "\n\n").replace(/&nbsp;/g, ' ').replace(/[ ]+/g, ' ').replace(/%22/g, '"').replace(/&amp;/g, '&').replace(/<\/?.+?>/g, '');
  return_text = return_text.replace(/&gt;/g, '>').replace(/&lt;/g, '<');
  return cb(return_text);
};

prettifyDescription = function(html_description, cb) {
  var child;
  return child = exec(`echo "${html_description}" | lynx -dump -stdin`, function(error, stdout, stderr) {
    var return_text;
    return_text = html_description;
    if (!error) {
      return_text = stdout;
    } else {
      stripHtml(return_text, function(cleaned) {
        return return_text = cleaned;
      });
    }
    return cb(return_text);
  });
};
