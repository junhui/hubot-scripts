// Description:
//   Pulls a random programmer Ryan Gosling image

// Dependencies:
//   None

// Configuration:
//   HUBOT_TUMBLR_API_KEY

// Commands:
//   hubot gos(ling)? me - Receive a programmer Ryan Gosling meme
//   hubot gos(ling)? bomb N - Receive N programmer Ryan Gosling memes

// Author:
//   jessedearing
var api_key, getGoslingImage, getRandomGoslingImageUrl;

api_key = process.env.HUBOT_TUMBLR_API_KEY;

getRandomGoslingImageUrl = function(msg, rand) {
  return msg.http(`http://api.tumblr.com/v2/blog/programmerryangosling.tumblr.com/posts?api_key=${api_key}&offset=${rand}&limit=1`).get()(function(err, res, body) {
    var post;
    post = JSON.parse(body);
    return msg.send(post.response.posts[0].photos[0].original_size.url);
  });
};

getGoslingImage = function(msg) {
  return msg.http(`http://api.tumblr.com/v2/blog/programmerryangosling.tumblr.com/posts?api_key=${api_key}`).get()(function(err, res, body) {
    var rand, total_posts;
    total_posts = JSON.parse(body).response.posts.length;
    rand = Math.floor(Math.random() * total_posts);
    return getRandomGoslingImageUrl(msg, rand);
  });
};

module.exports = function(robot) {
  robot.respond(/gos(ling)? me/i, function(msg) {
    return getGoslingImage(msg);
  });
  return robot.respond(/gos(ling)? bomb (\d+)/i, function(msg) {
    var count, i, num, ref, results;
    count = msg.match[2] || 5;
    results = [];
    for (num = i = ref = count; (ref <= 1 ? i <= 1 : i >= 1); num = ref <= 1 ? ++i : --i) {
      results.push(getGoslingImage(msg));
    }
    return results;
  });
};
