// Description:
//   wrapper for TeamCity REST API

// Dependencies:
//   "underscore": "1.3.3"

// Configuration:
//   HUBOT_TEAMCITY_USERNAME = <user name>
//   HUBOT_TEAMCITY_PASSWORD = <password>
//   HUBOT_TEAMCITY_HOSTNAME = <host : port>
//   HUBOT_TEAMCITY_SCHEME = <http || https> defaults to http if not set.

// Commands:
//   hubot show me builds - Show status of currently running builds
//   hubot tc list projects - Show all available projects
//   hubot tc list buildTypes - Show all available build types
//   hubot tc list buildTypes of <project> - Show all available build types for the specified project
//   hubot tc list builds <buildType> <number> - Show the status of the last <number> builds.  Number defaults to five.
//   hubot tc list builds of <buildType> of <project> <number>- Show the status of the last <number> builds of the specified build type of the specified project. Number can only follow the last variable, so if project is not passed, number must follow buildType directly. <number> Defaults to 5
//   hubot tc build start <buildType> - Adds a build to the queue for the specified build type
//   hubot tc build start <buildType> of <project> - Adds a build to the queue for the specified build type of the specified project
//   hubot tc build stop all <buildType> id <buildId> of <project> - Stops all currently running builds of a given buildType. Project parameter is optional. Please note that the special 'all' keyword will kill all currently running builds ignoring all further parameters. hubot tc build stop all all

// Author:
//   Micah Martin and Jens Jahnke
//Contributor:
//   Abraham Polishchuk
var _, util;

util = require('util');

_ = require('underscore');

module.exports = function(robot) {
  var base_url, buildTypes, createAndPublishBuildMap, getAuthHeader, getBuildType, getBuildTypes, getBuilds, getCurrentBuilds, getProjects, hostname, mapAndKillBuilds, mapBuildToNameList, mapNameToIdForBuildType, password, scheme, username;
  username = process.env.HUBOT_TEAMCITY_USERNAME;
  password = process.env.HUBOT_TEAMCITY_PASSWORD;
  hostname = process.env.HUBOT_TEAMCITY_HOSTNAME;
  scheme = process.env.HUBOT_TEAMCITY_SCHEME || "http";
  base_url = `${scheme}://${hostname}`;
  buildTypes = [];
  getAuthHeader = function() {
    return {
      Authorization: `Basic ${new Buffer(`${username}:${password}`).toString("base64")}`,
      Accept: "application/json"
    };
  };
  getBuildType = function(msg, type, callback) {
    var url;
    url = `${base_url}/httpAuth/app/rest/buildTypes/${type}`;
    return msg.http(url).headers(getAuthHeader()).get()(function(err, res, body) {
      if (res.statusCode !== 200) {
        err = body;
      }
      return callback(err, body, msg);
    });
  };
  getCurrentBuilds = function(msg, type, callback) {
    var url;
    if (arguments.length === 2) {
      if (Object.prototype.toString.call(type) === "[object Function]") {
        callback = type;
        url = `${base_url}/httpAuth/app/rest/builds/?locator=running:true`;
      }
    } else {
      url = `${base_url}/httpAuth/app/rest/builds/?locator=buildType:${type},running:true`;
    }
    return msg.http(url).headers(getAuthHeader()).get()(function(err, res, body) {
      if (res.statusCode !== 200) {
        err = body;
      }
      return callback(err, body, msg);
    });
  };
  getProjects = function(msg, callback) {
    var url;
    url = `${base_url}/httpAuth/app/rest/projects`;
    return msg.http(url).headers(getAuthHeader()).get()(function(err, res, body) {
      var projects;
      if (res.statusCode !== 200) {
        err = body;
      }
      if (!err) {
        projects = JSON.parse(body).project;
      }
      return callback(err, msg, projects);
    });
  };
  getBuildTypes = function(msg, project, callback) {
    var projectSegment, url;
    projectSegment = '';
    if (project != null) {
      projectSegment = '/projects/name:' + encodeURIComponent(project);
    }
    url = `${base_url}/httpAuth/app/rest${projectSegment}/buildTypes`;
    return msg.http(url).headers(getAuthHeader()).get()(function(err, res, body) {
      if (res.statusCode !== 200) {
        err = body;
      }
      if (!err) {
        buildTypes = JSON.parse(body).buildType;
      }
      return callback(err, msg, buildTypes);
    });
  };
  getBuilds = function(msg, project, configuration, amount, callback) {
    var projectSegment, url;
    projectSegment = '';
    if (project != null) {
      projectSegment = `/projects/name:${encodeURIComponent(project)}`;
    }
    url = `${base_url}/httpAuth/app/rest${projectSegment}/buildTypes/name:${encodeURIComponent(configuration)}/builds`;
    return msg.http(url).headers(getAuthHeader()).query({
      locator: [`count:${amount}`, "running:any"].join(",")
    }).get()(function(err, res, body) {
      var builds;
      if (res.statusCode !== 200) {
        err = body;
      }
      if (!err) {
        builds = JSON.parse(body).build;
      }
      return callback(err, msg, builds);
    });
  };
  mapNameToIdForBuildType = function(msg, project, name, callback) {
    var execute, result;
    execute = function(buildTypes) {
      var buildType;
      buildType = _.find(buildTypes, function(bt) {
        return bt.name === name && ((project == null) || bt.projectName === project);
      });
      if (buildType) {
        return buildType.id;
      }
    };
    result = execute(buildTypes);
    if (result) {
      callback(msg, result);
      return;
    }
    return getBuildTypes(msg, project, function(err, msg, buildTypes) {
      return callback(msg, execute(buildTypes));
    });
  };
  mapBuildToNameList = function(build) {
    var id, msg, url;
    id = build['buildTypeId'];
    msg = build['messengerBot'];
    url = `${base_url}/httpAuth/app/rest/buildTypes/id:${id}`;
    return msg.http(url).headers(getAuthHeader()).get()(function(err, res, body) {
      var baseMessage, buildName, message, status;
      if (!(res.statusCode = 200)) {
        err = body;
      }
      if (!err) {
        buildName = JSON.parse(body).name;
        baseMessage = `#${build.number} of ${buildName} ${build.webUrl}`;
        if (build.running) {
          status = build.status === "SUCCESS" ? "**Winning**" : "__FAILING__";
          message = `${status} ${build.percentageComplete}% Complete :: ${baseMessage}`;
        } else {
          status = build.status === "SUCCESS" ? "OK!" : "__FAILED__";
          message = `${status} :: ${baseMessage}`;
        }
        return msg.send(message);
      }
    });
  };
  createAndPublishBuildMap = function(builds, msg) {
    var build, i, len, results;
    results = [];
    for (i = 0, len = builds.length; i < len; i++) {
      build = builds[i];
      build['messengerBot'] = msg;
      results.push(mapBuildToNameList(build));
    }
    return results;
  };
  mapAndKillBuilds = function(msg, name, id, project) {
    var comment;
    comment = "killed by hubot";
    return getCurrentBuilds(msg, function(err, builds, msg) {
      if (typeof builds === 'string') {
        builds = JSON.parse(builds);
      }
      if (builds['count'] === 0) {
        msg.send("No builds are currently running");
        return;
      }
      return mapNameToIdForBuildType(msg, project, name, function(msg, buildType) {
        var build, buildName, i, len, ref, results, url;
        buildName = buildType;
        ref = builds['build'];
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          build = ref[i];
          if (name === 'all' || (build['id'] === parseInt(id) && (id != null)) || (build['buildTypeId'] === buildName && (buildName != null) && (id == null))) {
            url = `${base_url}/ajax.html?comment=${comment}&submit=Stop&buildId=${build['id']}&kill`;
            results.push(msg.http(url).headers(getAuthHeader()).get()(function(err, res, body) {
              if (res.statusCode !== 200) {
                err = body;
              }
              if (err) {
                return msg.send("Fail! Something went wrong. Couldn't stop the build for some reason");
              } else {
                return msg.send("The requested builds have been killed");
              }
            }));
          } else {
            results.push(void 0);
          }
        }
        return results;
      });
    });
  };
  robot.respond(/show me builds/i, function(msg) {
    return getCurrentBuilds(msg, function(err, builds, msg) {
      if (typeof builds === 'string') {
        builds = JSON.parse(builds);
      }
      if (builds['count'] === 0) {
        msg.send("No builds are currently running");
        return;
      }
      return createAndPublishBuildMap(builds['build'], msg);
    });
  });
  robot.respond(/tc build start (.*)/i, function(msg) {
    var buildName, buildTypeMatches, buildTypeRE, configuration, project;
    configuration = buildName = msg.match[1];
    project = null;
    buildTypeRE = /(.*?) of (.*)/i;
    buildTypeMatches = buildName.match(buildTypeRE);
    if (buildTypeMatches != null) {
      configuration = buildTypeMatches[1];
      project = buildTypeMatches[2];
    }
    return mapNameToIdForBuildType(msg, project, configuration, function(msg, buildType) {
      var url;
      if (!buildType) {
        msg.send(`Build type ${buildName} was not found`);
        return;
      }
      url = `${base_url}/httpAuth/action.html?add2Queue=${buildType}`;
      return msg.http(url).headers(getAuthHeader()).get()(function(err, res, body) {
        if (res.statusCode !== 200) {
          err = body;
        }
        if (err) {
          return msg.send("Fail! Something went wrong. Couldn't start the build for some reason");
        } else {
          return msg.send(`Dropped a build in the queue for ${buildName}. Run \`tc list builds of ${buildName}\` to check the status`);
        }
      });
    });
  });
  robot.respond(/tc list (projects|buildTypes|builds) ?(.*)?/i, function(msg) {
    var amount, buildTypeMatches, buildTypeRE, configuration, matches, option, project, projectRE, type;
    type = msg.match[1];
    option = msg.match[2];
    switch (type) {
      case "projects":
        return getProjects(msg, function(err, msg, projects) {
          var i, len, message, project;
          message = "";
          for (i = 0, len = projects.length; i < len; i++) {
            project = projects[i];
            message += project.name + "\n";
          }
          return msg.send(message);
        });
      case "buildTypes":
        project = null;
        if (option != null) {
          projectRE = /^\s*of (.*)/i;
          matches = option.match(projectRE);
          if ((matches != null) && matches.length > 1) {
            project = matches[1];
          }
        }
        return getBuildTypes(msg, project, function(err, msg, buildTypes) {
          var buildType, i, len, message;
          message = "";
          for (i = 0, len = buildTypes.length; i < len; i++) {
            buildType = buildTypes[i];
            message += `${buildType.name} of ${buildType.projectName}\n`;
          }
          return msg.send(message);
        });
      case "builds":
        configuration = option;
        project = null;
        if (configuration == null) {
          msg.send("builds of which project?");
          return;
        }
        buildTypeRE = /^\s*of (.*?) of (.+) (\d+)/i;
        buildTypeMatches = option.match(buildTypeRE);
        if (buildTypeMatches != null) {
          configuration = buildTypeMatches[1];
          project = buildTypeMatches[2];
          amount = parseInt(buildTypeMatches[3]);
        } else {
          buildTypeRE = /^\s*of (.+) (\d+)/i;
          buildTypeMatches = option.match(buildTypeRE);
          if (buildTypeMatches != null) {
            configuration = buildTypeMatches[1];
            amount = parseInt(buildTypeMatches[2]);
            project = null;
          } else {
            amount = 5;
            buildTypeRE = /^\s*of (.*?) of (.*)/i;
            buildTypeMatches = option.match(buildTypeRE);
            if (buildTypeMatches != null) {
              configuration = buildTypeMatches[1];
              project = buildTypeMatches[2];
            } else {
              buildTypeRE = /^\s*of (.*)/i;
              buildTypeMatches = option.match(buildTypeRE);
              if (buildTypeMatches != null) {
                configuration = buildTypeMatches[1];
                project = null;
              }
            }
          }
        }
        return getBuilds(msg, project, configuration, amount, function(err, msg, builds) {
          if (!builds || builds.length === 0) {
            msg.send(`Could not find builds for ${option}`);
            return;
          }
          return createAndPublishBuildMap(builds, msg);
        });
    }
  });
  return robot.respond(/tc build stop all (.*)/i, function(msg) {
    return getCurrentBuilds(msg, function(err, builds, msg) {
      var buildName, buildTypeMatches, buildTypeRE, configuration, id, project;
      if (typeof builds === 'string') {
        builds = JSON.parse(builds);
      }
      if (builds['count'] === 0) {
        msg.send("No builds are currently running");
        return;
      }
      configuration = buildName = msg.match[1];
      project = null;
      id = null;
      buildTypeRE = /(.*) if (.*) of (.*)/i;
      buildTypeMatches = buildName.match(buildTypeRE);
      if (buildTypeMatches != null) {
        configuration = buildTypeMatches[1];
        id = buildTypeMatches[2];
        project = buildTypeMatches[3];
      } else {
        buildTypeRE = /(.*) of (.*)/i;
        buildTypeMatches = buildName.match(buildTypeRE);
        if (buildTypeMatches != null) {
          configuration = buildTypeMatches[1];
          project = buildTypeMatches[2];
        } else {
          buildTypeRE = /(.*) id (.*)/;
          buildTypeMatches = buildName.match(buildTypeRE);
          if (buildTypeMatches != null) {
            configuration = buildTypeMatches[1];
            id = buildTypeMatches[2];
          } else {
            buildTypeRE = /(.*)/;
            buildTypeMatches = buildName.match(buildTypeRE);
            if (buildTypeMatches != null) {
              configuration = buildTypeMatches[1];
            }
          }
        }
      }
      return mapAndKillBuilds(msg, configuration, id, project);
    });
  });
};
