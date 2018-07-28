// Description:
//   Display photos from a Tumblr blog

// Dependencies:
//   None

// Configuration:
//   HUBOT_TUMBLR_BLOG_NAME
//   HUBOT_TUMBLR_API_KEY

// Commands:
//   hubot show me tumblr <count> - Shows the latest <count> tumblr photos (default is 1)

// Author:
//   pgieser
module.exports = function(robot) {
  var api_key, blog_name;
  blog_name = process.env.HUBOT_TUMBLR_BLOG_NAME;
  api_key = process.env.HUBOT_TUMBLR_API_KEY;
  return robot.respond(/show (me )?tumblr( (\d+))?/i, function(msg) {
    var count;
    count = msg.match[3] || 1;
    return msg.http(`http://api.tumblr.com/v2/blog/${blog_name}.tumblr.com/posts/photo`).query({
      api_key: api_key,
      limit: count
    }).get()(function(err, res, body) {
      var content, i, len, photo, post, posts, results;
      if (err) {
        msg.send(`Tumblr says: ${err}`);
        return;
      }
      content = JSON.parse(body);
      if (content.meta.status !== 200) {
        msg.send(`Tumblr says: ${content.meta.msg}`);
        return;
      }
      posts = content.response.posts;
      results = [];
      for (i = 0, len = posts.length; i < len; i++) {
        post = posts[i];
        if (posts.length === 1) {
          msg.send(post.caption);
        }
        results.push((function() {
          var j, len1, ref, results1;
          ref = post.photos;
          results1 = [];
          for (j = 0, len1 = ref.length; j < len1; j++) {
            photo = ref[j];
            results1.push(msg.send(photo.original_size.url));
          }
          return results1;
        })());
      }
      return results;
    });
  });
};
