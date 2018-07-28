// Description:
//   Beanstalk tools

// Dependencies:
//   None

// Configuration:
//   HUBOT_BEANSTALK_SUBDOMAIN
//   HUBOT_BEANSTALK_ACCOUNT
//   HUBOT_BEANSTALK_PASSWORD

// Commands:
//   beanstalk repositories - List beanstalk repositories
//   beanstalk commits - List beanstalk recent commits
//   beanstalk users - List beanstalk users
//   beanstalk deployments - List beanstalk recent deployments

// Author:
//   eliperkins
module.exports = function(robot) {
  var beanstalk_request;
  robot.respond(/beanstalk repositories/i, function(msg) {
    return beanstalk_request(msg, 'api/repositories.json', function(repositories) {
      var child, i, len, repository, results;
      if (repositories.count <= 0) {
        msg.send("No repositories found for this account");
        return;
      }
      results = [];
      for (i = 0, len = repositories.length; i < len; i++) {
        child = repositories[i];
        repository = child.repository;
        results.push(msg.send(`${repository.name} (${repository.vcs}) -> Last commit: ${repository.last_commit_at}`));
      }
      return results;
    });
  });
  robot.respond(/beanstalk commits/i, function(msg) {
    return beanstalk_request(msg, 'api/changesets.json', function(changesets) {
      var repositories;
      if (changesets.count <= 0) {
        msg.send("No changesets found for this account");
        return;
      }
      repositories = [];
      return beanstalk_request(msg, 'api/repositories.json', function(result) {
        var changeset, child, i, j, len, len1, results;
        for (i = 0, len = result.length; i < len; i++) {
          child = result[i];
          repositories[`${child.repository.id}`] = child.repository;
        }
        results = [];
        for (j = 0, len1 = changesets.length; j < len1; j++) {
          child = changesets[j];
          changeset = child.revision_cache;
          results.push(msg.send(repositories[`${changeset.repository_id}`].name + ` -> Committed: ${changeset.time} by ${changeset.author}`));
        }
        return results;
      });
    });
  });
  robot.respond(/beanstalk users/i, function(msg) {
    return beanstalk_request(msg, 'api/users.json', function(users) {
      var child, i, len, results, role, user;
      if (users.count <= 0) {
        msg.send("No users found for this account");
        return;
      }
      results = [];
      for (i = 0, len = users.length; i < len; i++) {
        child = users[i];
        user = child.user;
        role = user.owner ? "owner" : user.admin ? "admin" : "user";
        results.push(msg.send(`${user.first_name} ${user.last_name} (${user.email}) -> Role: ${role} Joined: ${user.created_at}`));
      }
      return results;
    });
  });
  robot.respond(/beanstalk deployments/i, function(msg) {
    return beanstalk_request(msg, 'api/releases.json', function(deployments) {
      var repositories;
      if (deployments <= 0) {
        msg.send("No deployments found for this account");
        return;
      }
      repositories = [];
      return beanstalk_request(msg, 'api/repositories.json', function(result) {
        var child, deployment, i, j, len, len1, results;
        for (i = 0, len = result.length; i < len; i++) {
          child = result[i];
          repositories[`${child.repository.id}`] = child.repository;
        }
        results = [];
        for (j = 0, len1 = deployments.length; j < len1; j++) {
          child = deployments[j];
          deployment = child.release;
          results.push(msg.send(repositories[`${deployment.repository_id}`].name + ` deployed to ${deployment.environment_name} on ${deployment.created_at}`));
        }
        return results;
      });
    });
  });
  return beanstalk_request = function(msg, url, handler) {
    var auth, beanstalk_url;
    auth = new Buffer(`${process.env.HUBOT_BEANSTALK_ACCOUNT}:${process.env.HUBOT_BEANSTALK_PASSWORD}`).toString('base64');
    beanstalk_url = `https://${process.env.HUBOT_BEANSTALK_SUBDOMAIN}.beanstalkapp.com`;
    return msg.http(`${beanstalk_url}/${url}`).headers({
      Authorization: `Basic ${auth}`,
      Accept: "application/json"
    }).get()(function(err, res, body) {
      var content;
      if (err) {
        msg.send(`Beanstalk says: ${err}`);
        return;
      }
      content = JSON.parse(body);
      if (content.errors) {
        msg.send(`Beanstalk says: ${content.errors[0]}`);
        return;
      }
      return handler(content);
    });
  };
};
