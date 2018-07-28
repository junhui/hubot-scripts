// Description:
//   Shorten URLs with bit.ly & expand detected bit.ly URLs

// Dependencies:
//   None

// Configuration:
//   HUBOT_BITLY_ACCESS_TOKEN

// Commands:
//   hubot (bitly|shorten) (me) <url> - Shorten the URL using bit.ly
//   http://bit.ly/[hash] - looks up the real url

// Author:
//   sleekslush
//   drdamour
//   johnwyles
module.exports = function(robot) {
  robot.respond(/(bitly|shorten)\s?(me)?\s?(.+)$/i, function(msg) {
    return msg.http("https://api-ssl.bitly.com/v3/shorten").query({
      access_token: process.env.HUBOT_BITLY_ACCESS_TOKEN,
      longUrl: msg.match[3],
      format: "json"
    }).get()(function(err, res, body) {
      var response;
      response = JSON.parse(body);
      return msg.send(response.status_code === 200 ? response.data.url : response.status_txt);
    });
  });
  //TODO: can we make this list more expansive/dynamically generated?
  return robot.hear(/(https?:\/\/(bit\.ly|yhoo\.it|j\.mp|pep\.si|amzn\.to)\/[0-9a-z\-]+)/ig, function(msg) {
    return msg.http("https://api-ssl.bitly.com/v3/expand").query({
      access_token: process.env.HUBOT_BITLY_ACCESS_TOKEN,
      shortUrl: msg.match
    }).get()(function(err, res, body) {
      var i, len, m, parsedBody, ref, results;
      parsedBody = JSON.parse(body);
      if (parsedBody.status_code === !200) {
        msg.send(`Lookup failed ${response.status_txt}`);
        return;
      }
      ref = parsedBody.data.expand;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        m = ref[i];
        results.push(msg.send(`${m.short_url} is ${m.long_url}`));
      }
      return results;
    });
  });
};
