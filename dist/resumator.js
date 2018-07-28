// Description:
//   Get information from the Resumator API.

// Commands:
//   hubot job list - Returns the current list of jobs from The Resumator
//   hubot job applicants - Returns the current list of applicants in the pipeline of the Resumator
module.exports = function(robot) {
  robot.respond(/job list$/i, function(msg) {
    return robot.http(`https://api.resumatorapi.com/v1/jobs?apikey=${process.env.RESUMATOR_APIKEY}`).get()(function(err, res, body) {
      var i, job, len, ref, results;
      ref = JSON.parse(body).slice(0, 11);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        job = ref[i];
        if (job.status === "Open") {
          results.push(msg.send(`${job.title} > http://${process.env.RESUMATOR_USERNAME}.theresumator.com/apply/${job.board_code}`));
        }
      }
      return results;
    });
  });
  return robot.respond(/job applicants$/i, function(msg) {
    return robot.http(`https://api.resumatorapi.com/v1/applicants?apikey=${process.env.RESUMATOR_APIKEY}`).get()(function(err, res, body) {
      var app, i, len, ref, results;
      ref = JSON.parse(body).slice(0, 11);
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        app = ref[i];
        results.push(msg.send(`${app.first_name} ${app.last_name} for [${app.job_title}]`));
      }
      return results;
    });
  });
};
