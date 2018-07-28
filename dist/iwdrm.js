// Description:
//   Pulls a movie gif from the best tumblog

// Dependencies:
//   None

// Configuration:
//   HUBOT_TUMBLR_API_KEY - A Tumblr OAuth Consumer Key will work fine

// Commands:
//   hubot movie me - Displays a moving still from IWDRM

// Author:
//   iangreenleaf
module.exports = function(robot) {
  return robot.respond(/(movie|iwdrm)( me)?( .*)/i, function(msg) {
    var clean_quotes, tumblr_request;
    tumblr_request = function(offset, success) {
      var params;
      params = {
        api_key: process.env.HUBOT_TUMBLR_API_KEY,
        limit: 1,
        offset: offset
      };
      return msg.http('http://api.tumblr.com/v2/blog/iwdrm.tumblr.com/posts/photo').query(params).get()(function(err, res, body) {
        if (err) {
          return robot.logger.error(err);
        } else if (res.statusCode !== 200) {
          return robot.logger.error(`Received status code ${res.statusCode}.`);
        } else {
          return success(JSON.parse(body));
        }
      });
    };
    clean_quotes = function(text) {
      var entity, ref, replacement;
      ref = {
        "&#822[01];": '"',
        "&#8217;": "'",
        "&#8230;": "--"
      };
      for (entity in ref) {
        replacement = ref[entity];
        text = text.replace(RegExp(entity, "g"), replacement);
      }
      return text;
    };
    return tumblr_request(0, function(data) {
      var offset, total_posts;
      total_posts = data.response.total_posts;
      offset = Math.round((total_posts - 1) * Math.random());
      return tumblr_request(offset, function(data) {
        var post, quote, title;
        post = data.response.posts.pop();
        msg.send(post.photos.pop().original_size.url);
        quote = clean_quotes(/<i>(.*?)<\/i>/.exec(post.caption)[1]);
        title = /<a [^>]*imdb.com[^>]*>(.*?)<\/a>/.exec(post.caption)[1];
        return msg.send(`${quote} ${title}`);
      });
    });
  });
};
