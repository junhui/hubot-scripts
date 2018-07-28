// Description:
//  Query and interact with your Quandora Q&A knowledge base.

// Dependencies:
//   None

// Configuration:
//   HUBOT_QUANDORA_DOMAIN
//   HUBOT_QUANDORA_USER
//   HUBOT_QUANDORA_PASSWD

// Commands:
//   hubot (q|ask|quandora query) <text> - search text in Quandora
//   hubot qs <n> - display question <n> after a search
//   hubot (qd|quandora domain) - display configured quandora domain

// Author:
//   b6
var api_auth, api_passwd, api_url, api_user, make_qurl, quandora_domain;

quandora_domain = process.env.HUBOT_QUANDORA_DOMAIN || "";

if (quandora_domain === "") {
  console.error("Quandora: no domain defined, you need to set HUBOT_QUANDORA_DOMAIN");
}

api_url = `https://${process.env.HUBOT_QUANDORA_DOMAIN}.quandora.com/m/json`;

api_user = process.env.HUBOT_QUANDORA_USER || "";

api_passwd = process.env.HUBOT_QUANDORA_PASSWD || "";

if (api_user && api_passwd) {
  api_auth = "Basic " + new Buffer(api_user + ':' + api_passwd).toString('base64');
  console.log("Quandora: Got Auth Data, going as " + api_user);
} else {
  console.log("No auth data: going anonymous");
  api_auth = "";
}

module.exports = function(robot) {
  robot.respond(/(ask|qs|quandora query) (.+)/i, function(msg) {
    var question;
    question = msg.match[2];
    return msg.http(api_url + "/search").headers({
      "Authorization": api_auth
    }).query({
      q: question
    }).get()(function(err, res, body) {
      var i, response, text;
      console.log(err);
      console.log(body);
      response = JSON.parse(body);
      if (response.type === "question-search-result") {
        robot.brain.data.quandora_latests = response.data.result;
        text = ["Top Matching questions in Quandora:"];
        i = 0;
        response.data.result.forEach(function(q) {
          var qurl;
          i++;
          qurl = make_qurl(q.uid);
          return text.push(`${i}. ${q.title} [re: ${q.answers}] <${qurl}>`);
        });
        return msg.send(text.join("\n"));
      } else if (response.type === "error") {
        return msg.send(`Quandora lookup error: ${response.data.message}`);
      }
    });
  });
  robot.respond(/(q|quandora) ([0-9])/i, function(msg) {
    var i, q, qcontent;
    i = msg.match[2] - 1;
    q = robot.brain.data.quandora_latests[i] || null;
    if (q) {
      qcontent = [q.title, q.summary, `${q.votes} votes / ${q.answers} answers`, make_qurl(q.uid)];
      return msg.send(qcontent.join("\n"));
    } else {
      return msg.send(`Can't find question ${i + 1}`);
    }
  });
  return robot.respond(/(quandora domain|qd)/i, function(msg) {
    return msg.send(`Quandora Domain: ${quandora_domain}`);
  });
};

make_qurl = function(uid) {
  var app_url;
  app_url = "https://app.quandora.com/";
  return app_url + "object/" + uid;
};
