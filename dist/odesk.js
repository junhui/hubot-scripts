// Description:
//   Search jobs from oDesk platform and return best results

// Dependencies:
//   None

// Configuration:
//   HUBOT_BITLY_USERNAME
//   HUBOT_BITLY_API_KEY
//   (preferred but not required)

// Commands:
//   hubot odesk|offer me <keywords> - Get most recent jobs from oDesk filtered by keywords
//   hubot best odesk|offer me <keywords> - Get most recent dream jobs from oDesk filtered by keywords

// Notes:
//   Bitly environment variables are not required but preferred in order to shorten URLs

// Author:
//   gtoroap
var daysAgo, odeskUrl, renderBody, shortenUrl;

odeskUrl = 'https://www.odesk.com/api/profiles/v1/search/jobs.json';

module.exports = function(robot) {
  robot.respond(/(offer|odesk)( me)? (.*)/i, function(msg) {
    return msg.http(odeskUrl).query({
      q: msg.match[3],
      page: '0;5'
    }).get()(function(err, res, body) {
      return renderBody(msg, body);
    });
  });
  return robot.respond(/best (offer|odesk)( me)? (.*)$/i, function(msg) {
    return msg.http(odeskUrl).query({
      q: msg.match[3],
      t: 'Hourly',
      page: '0;5',
      fb: 4,
      tba: 5,
      wl: '40',
      dur: '26',
      dp: daysAgo(7)
    }).get()(function(err, res, body) {
      return renderBody(msg, body);
    });
  });
};

renderBody = function(msg, body) {
  var error, i, job, len, results, results1;
  try {
    results = JSON.parse(body)['jobs']['job'];
    results1 = [];
    for (i = 0, len = results.length; i < len; i++) {
      job = results[i];
      if (process.env.HUBOT_BITLY_USERNAME && process.env.HUBOT_BITLY_API_KEY) {
        results1.push(shortenUrl(msg, job, `https://www.odesk.com/o/jobs/job/${job['legacy_ciphertext']}`));
      } else {
        results1.push(msg.send(`${job['op_title']} \n https://www.odesk.com/o/jobs/job/${job['legacy_ciphertext']}`));
      }
    }
    return results1;
  } catch (error1) {
    error = error1;
    return msg.send("Sorry, jobs not found. Please check your keywords spelling and try it again.");
  }
};

daysAgo = function(days) {
  var d;
  d = new Date(new Date().setDate(new Date().getDate() - days));
  return (d.getMonth() + 1).toString() + '-' + d.getDate().toString() + '-' + d.getFullYear().toString();
};

shortenUrl = function(msg, job, url) {
  return msg.http("http://api.bitly.com/v3/shorten").query({
    login: process.env.HUBOT_BITLY_USERNAME,
    apiKey: process.env.HUBOT_BITLY_API_KEY,
    longUrl: url
  }).get()(function(err, res, body) {
    var response;
    response = JSON.parse(body);
    url = response['data']['url'];
    return msg.send(`${job['op_title']} => ${url}`);
  });
};
