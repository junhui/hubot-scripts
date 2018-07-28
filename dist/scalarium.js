// Description:
//   Interact with Scalarium cloud hosting

// Dependencies:
//   None

// Configuration:
//   HUBOT_SCALARIUM_TOKEN: for authenticating the requests (see https://manage.scalarium.com/users/<user-id>/api)

// Commands:
//   hubot scalarium list (apps|clouds) - Lists all applications/clouds on scalarium
//   hubot scalarium deploy <app id> <message> - Triggers an deployment of *app id* with *message*

// Author:
//   nesQuick
var ScalariumClient, client, https, token;

https = require('https');

token = process.env.HUBOT_SCALARIUM_TOKEN;

ScalariumClient = class ScalariumClient {
  constructor(https1, token1) {
    this.https = https1;
    this.token = token1;
  }

  getApplications(cb) {
    return this.request('/applications', 'GET', {}, cb);
  }

  getClouds(cb) {
    return this.request('/clouds', 'GET', {}, cb);
  }

  deploy(appId, msg, cb, finishedCb) {
    var that;
    that = this;
    return this.request(`/applications/${appId}/deploy`, 'POST', {
      command: 'deploy',
      comment: `Hubot deploy - ${msg}`
    }, function(result) {
      that.registerRunningDeploy(result, finishedCb);
      return cb(result);
    });
  }

  registerRunningDeploy(deploy, cb) {
    var intervalId, that;
    that = this;
    return intervalId = setInterval(function() {
      return that.request(`/applications/${deploy.application_id}/deployments/${deploy.id}`, 'GET', {}, function(result) {
        if (result.status !== 'running') {
          cb(result);
          return clearInterval(intervalId);
        }
      });
    }, 10000);
  }

  request(path, method, body, cb) {
    var options, req;
    options = {
      host: 'manage.scalarium.com',
      method: method,
      path: `/api${path}`,
      headers: {
        'X-Scalarium-Token': this.token,
        Accept: 'application/vnd.scalarium-v1+json'
      }
    };
    req = this.https.request(options, function(res) {
      var data;
      data = '';
      res.on('data', function(chunk) {
        return data = `${data}${chunk}`;
      });
      return res.on('end', function() {
        return cb(JSON.parse(data));
      });
    });
    req.write(JSON.stringify(body));
    return req.end();
  }

};

client = new ScalariumClient(https, token);

module.exports = function(robot) {
  robot.respond(/scalarium list apps/i, function(message) {
    return client.getApplications(function(apps) {
      var app, i, len, results;
      results = [];
      for (i = 0, len = apps.length; i < len; i++) {
        app = apps[i];
        results.push(message.send(`${app.name} - ${app.id}`));
      }
      return results;
    });
  });
  robot.respond(/scalarium list clouds/i, function(message) {
    return client.getClouds(function(clouds) {
      var cloud, i, len, results;
      results = [];
      for (i = 0, len = clouds.length; i < len; i++) {
        cloud = clouds[i];
        results.push(message.send(`${cloud.name} - ${cloud.id}`));
      }
      return results;
    });
  });
  robot.respond(/scalarium deploy ([0-9a-f]+) (.+)$/i, function(message) {
    return client.deploy(message.match[1], message.match[2], function(deploy) {
      return message.send(`Yes Sir! Deployment triggered with id ${deploy.id}. Will drop a note when it's done.`);
    }, function(finished) {
      var success;
      success = finished.status === 'successful';
      return message.send(`${(success ? 'Success' : 'FAIL! FAIL! FAIL!!')}! Your deployment "${finished.comment}" with id ${finished.id} ${(success ? 'is done' : 'failed')}.`);
    });
  });
  return robot.scalarium = {
    getApplications: client.getApplications,
    getClouds: client.getClouds
  };
};
