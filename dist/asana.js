// Description:
//   A way to add tasks to Asana

// Dependencies:
//   None

// Configuration:
//   HUBOT_ASANA_API_KEY - find this in Account Settings -> API

//   HUBOT_ASANA_WORKSPACE_ID - list all workspaces using
//   curl -u <api_key>: https://app.asana.com/api/1.0/workspaces
//   (note the colon after the api key)

//   HUBOT_ASANA_PROJECT_ID - list all projects in the workspace using:
//   curl -u <api_key>: https://app.asana.com/api/1.0/workspaces/<workspace id>/projects

// Commands:
//   todo: @name? <task directive> - public message starting with todo: will add task, optional @name to assign task
//   hubot todo users - Message the bot directly to list all available users in the workspace

// Author:
//   idpro
//   abh1nav
//   rajiv
var addTask, api_key, getRequest, postRequest, project, url, workspace;

url = 'https://app.asana.com/api/1.0';

workspace = process.env.HUBOT_ASANA_WORKSPACE_ID;

project = process.env.HUBOT_ASANA_PROJECT_ID;

api_key = process.env.HUBOT_ASANA_API_KEY;

getRequest = function(msg, path, callback) {
  return msg.http(`${url}${path}`).headers({
    "Accept": "application/json"
  }).auth(api_key, '').get()(function(err, res, body) {
    return callback(err, res, body);
  });
};

postRequest = function(msg, path, params, callback) {
  var stringParams;
  stringParams = JSON.stringify(params);
  return msg.http(`${url}${path}`).headers({
    "Content-Length": stringParams.length,
    "Accept": "application/json"
  }).auth(api_key, '').post(stringParams)(function(err, res, body) {
    return callback(err, res, body);
  });
};

addTask = function(msg, taskName, path, params, userAcct) {
  return postRequest(msg, '/tasks', params, function(err, res, body) {
    var projectId, response;
    response = JSON.parse(body);
    if (response.data.errors) {
      return msg.send(response.data.errors);
    } else {
      projectId = response.data.id;
      params = {
        data: {
          project: `${project}`
        }
      };
      return postRequest(msg, `/tasks/${projectId}/addProject`, params, function(err, res, body) {
        response = JSON.parse(body);
        if (response.data) {
          if (userAcct) {
            return msg.send(`Task Created : ${taskName} : Assigned to @${userAcct}`);
          } else {
            return msg.send(`Task Created : ${taskName}`);
          }
        } else {
          return msg.send("Error creating task.");
        }
      });
    }
  });
};

module.exports = function(robot) {
  // Add a task
  robot.hear(/^(todo|task):\s?(@\w+)?(.*)/i, function(msg) {
    var params, taskName, userAcct;
    taskName = msg.match[3];
    if (msg.match[2] !== void 0) {
      userAcct = msg.match[2];
    }
    params = {
      data: {
        name: `${taskName}`,
        workspace: `${workspace}`
      }
    };
    if (userAcct) {
      userAcct = userAcct.replace(/^\s+|\s+$/g, "");
      userAcct = userAcct.replace("@", "");
      userAcct = userAcct.toLowerCase();
      return getRequest(msg, `/workspaces/${workspace}/users`, function(err, res, body) {
        var assignedUser, i, len, name, ref, response, user;
        response = JSON.parse(body);
        assignedUser = "";
        ref = response.data;
        for (i = 0, len = ref.length; i < len; i++) {
          user = ref[i];
          name = user.name.toLowerCase().split(" ");
          if (userAcct === name[0] || userAcct === name[1]) {
            assignedUser = user.id;
          }
        }
        if (assignedUser !== "") {
          params = {
            data: {
              name: `${taskName}`,
              workspace: `${workspace}`,
              assignee: `${assignedUser}`
            }
          };
          return addTask(msg, taskName, '/tasks', params, userAcct);
        } else {
          msg.send("Unable to Assign User");
          return addTask(msg, taskName, '/tasks', params, false);
        }
      });
    } else {
      return addTask(msg, taskName, '/tasks', params, false);
    }
  });
  // show task title
  robot.hear(/https:\/\/app\.asana\.com\/(\d+)\/(\d+)\/(\d+)/, function(msg) {
    var taskId;
    taskId = msg.match[3];
    return getRequest(msg, `/tasks/${taskId}`, function(err, res, body) {
      var name, response;
      response = JSON.parse(body);
      name = response.data.name;
      return msg.send(`${taskId}: ${name}`);
    });
  });
  // List all Users
  return robot.respond(/(todo users)/i, function(msg) {
    return getRequest(msg, `/workspaces/${workspace}/users`, function(err, res, body) {
      var i, len, ref, response, user, userList;
      response = JSON.parse(body);
      userList = "";
      ref = response.data;
      for (i = 0, len = ref.length; i < len; i++) {
        user = ref[i];
        userList += `${user.id} : ${user.name}\n`;
      }
      return msg.send(userList);
    });
  });
};
