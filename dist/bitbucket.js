// Description:
//   Announce changes to BitBucket repositories using BitBucket's POST service
//   to a room sepecified by the URL.

// Dependencies:
//   None

// Configuration:
//   For instructions on how to set up BitBucket's POST service for your
//   repositories, visit:
//   https://confluence.atlassian.com/display/BITBUCKET/POST+hook+management

// Author:
//   JRusbatch
module.exports = function(robot) {
  return robot.router.post('/hubot/bitbucket/:room', function(req, res) {
    var commit, commits, data, i, len, msg, room;
    room = req.params.room;
    data = JSON.parse(req.body.payload);
    commits = data.commits;
    msg = `${data.user} pushed ${commits.length} commits to ${data.repository.name}:\n\n`;
    for (i = 0, len = commits.length; i < len; i++) {
      commit = commits[i];
      msg += `[${commit.branch}] ${commit.message}\n`;
    }
    robot.messageRoom(room, msg);
    res.writeHead(204, {
      'Content-Length': 0
    });
    return res.end();
  });
};
