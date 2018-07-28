// Description
//   Show image metadata when imgur URLs are seen.

// Dependencies:
//   None

// Configuration:
//   HUBOT_IMGUR_CLIENTID - your client id from imgur

// Commands:
//   None

// Notes:
//   For text-based adapters like IRC.
//   You'll need to generate a Client-ID at:
//       https://api.imgur.com/oauth2/addclient

// Author:
//   mmb
var token;

token = `Client-ID ${process.env.HUBOT_IMGUR_CLIENTID}`;

module.exports = function(robot) {
  return robot.hear(/(?:http:\/\/)?(?:i\.)?imgur\.com\/(a\/)?(\w+)(?:\.(?:gif|jpe?g|png))?/i, function(msg) {
    var api_url, type;
    type = msg.match[1] != null ? 'gallery' : 'image';
    api_url = `https://api.imgur.com/3/${type}/${msg.match[2]}/`;
    return msg.http(api_url).headers({
      'Authorization': token
    }).get()(function(err, res, body) {
      var data;
      if (res.statusCode === 200) {
        data = JSON.parse(body);
        return msg.send(`imgur: ${data.data.title}`);
      } else {
        return console.error(`imgur-info script error: ${api_url} returned ${res.statusCode}: ${body}`);
      }
    });
  });
};
