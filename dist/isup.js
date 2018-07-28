// Description:
//   Uses downforeveryoneorjustme.com to check if a site is up

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot is <domain> up? - Checks if <domain> is up

// Author:
//   jmhobbs
var isUp;

module.exports = function(robot) {
  return robot.respond(/is (?:http\:\/\/)?(.*?) (up|down)(\?)?/i, function(msg) {
    return isUp(msg, msg.match[1], function(domain) {
      return msg.send(domain);
    });
  });
};

isUp = function(msg, domain, cb) {
  return msg.http(`http://isitup.org/${domain}.json`).header('User-Agent', 'Hubot').get()(function(err, res, body) {
    var response;
    response = JSON.parse(body);
    if (response.status_code === 1) {
      return cb(`${response.domain} looks UP from here.`);
    } else if (response.status_code === 2) {
      return cb(`${response.domain} looks DOWN from here.`);
    } else if (response.status_code === 3) {
      return cb(`Are you sure '${response.domain}' is a valid domain?`);
    } else {
      return msg.send(`Not sure, ${response.domain} returned an error.`);
    }
  });
};
