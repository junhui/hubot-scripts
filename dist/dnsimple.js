// Description:
//   Domain availability via DNSimple

// Dependencies:
//   None

// Configuration:
//   DNSIMPLE_USERNAME
//   DNSIMPLE_PASSWORD

// Commands:
//   check domain <domainname> - returns whether a domain is available

// Author:
//   jonmagic
module.exports = function(robot) {
  return robot.hear(/check domain (.*)/i, function(msg) {
    var auth, domain, pass, user;
    domain = escape(msg.match[1]);
    user = process.env.DNSIMPLE_USERNAME;
    pass = process.env.DNSIMPLE_PASSWORD;
    auth = 'Basic ' + new Buffer(user + ':' + pass).toString('base64');
    return msg.http(`https://dnsimple.com/domains/${domain}/check`).headers({
      Authorization: auth,
      Accept: 'application/json'
    }).get()(function(err, res, body) {
      switch (res.statusCode) {
        case 200:
          return msg.send(`Sorry, ${domain} is not available.`);
        case 404:
          return msg.send("Cybersquat that shit!");
        case 401:
          return msg.send("You need to authenticate by setting the DNSIMPLE_USERNAME & DNSIMPLE_PASSWORD environment variables");
        default:
          return msg.send("Unable to process your request and we're not sure why :(");
      }
    });
  });
};
