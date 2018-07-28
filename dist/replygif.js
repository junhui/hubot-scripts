// Description:
//   Show ReplyGifs based on tags. See http://replygif.net.

// Dependencies:
//   None

// Configuration:
//   HUBOT_REPLYGIF_API_KEY: the api key for replygif.net, defaults to public key "39YAprx5Yi"

// Commands:
//   hubot replygif <tag> - Embed a random ReplyGif with the given tag.
//   hubot replygif me <tag> - Same as `hubot replygif <tag>`.
//   hubot replygif id <id> - Embed the ReplyGif with the given id
//   hubot replygif me id <id> - Same as `hubot replygif id <id>`.

// Notes:
//   Use 'rg' as shorthand for the 'replygif' command

// Author:
//   altschuler (previous non-api version by sumeetjain, meatballhat)
var apiKey, apiUrl;

apiKey = process.env.HUBOT_REPLYGIF_API_KEY || "39YAprx5Yi";

apiUrl = `http://replygif.net/api/gifs?api-key=${apiKey}`;

module.exports = function(robot) {
  var apiCall;
  apiCall = function(msg, failMsg, query) {
    return robot.http(apiUrl + query).get()(function(err, res, body) {
      var gifs;
      try {
        gifs = JSON.parse(body);
      } catch (error) {}
      if ((gifs == null) || !gifs.length) {
        return msg.send(failMsg);
      } else {
        return msg.send((msg.random(gifs)).file);
      }
    });
  };
  robot.hear(/.*replygif\.net\/(i\/)?(\d+)(?!.*\.gif).*/i, function(msg) {
    var id;
    id = msg.match[2];
    return msg.send(`http://replygif.net/i/${id}.gif`);
  });
  robot.respond(/(replygif|rg)( me)? ([\w|\ ]+)/i, function(msg) {
    var tag;
    tag = msg.match[3];
    if (tag === "id") { // hubot's looking for an id
      return;
    }
    return apiCall(msg, "I don't know that reaction", `&tag=${tag}`);
  });
  return robot.respond(/(replygif|rg)( me)? id (\d+)/i, function(msg) {
    var id;
    id = msg.match[3];
    return apiCall(msg, "I don't any gifs with that id", `&id=${id}`);
  });
};
