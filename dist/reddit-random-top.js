// Description:
//   None

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot a reddit <subreddit> - A random top (today) post from the specified subreddit. Tries to find a picture if possible

// Author:
//   artfuldodger
var getPost, reddit;

module.exports = function(robot) {
  return robot.respond(/a reddit( .+)*/i, function(msg) {
    var ref;
    return reddit(msg, (ref = msg.match[1]) != null ? ref.trim() : void 0);
  });
};

reddit = function(msg, subreddit) {
  var url;
  url = subreddit != null ? `http://www.reddit.com/r/${subreddit}/top.json` : "http://www.reddit.com/top.json";
  return msg.http(url).get()(function(err, res, body) {
    var post, posts, ref, ref1, tries_to_find_picture;
    
    // Sometimes when a subreddit doesn't exist, it wants to redirect you to the search page.
    // Oh, and it doesn't send back 302s as JSON
    if ((body != null ? (ref = body.match(/^302/)) != null ? ref[0] : void 0 : void 0) === '302') {
      msg.send("That subreddit does not seem to exist.");
      return;
    }
    posts = JSON.parse(body);
    // If the response has an error attribute, let's get out of here.
    if (posts.error != null) {
      msg.send(`That doesn't seem to be a valid subreddit. [http response ${posts.error}]`);
      return;
    }
    if (!((((ref1 = posts.data) != null ? ref1.children : void 0) != null) && posts.data.children.length > 0)) {
      msg.send("While that subreddit exists, there does not seem to be anything there.");
      return;
    }
    post = getPost(posts);
    tries_to_find_picture = 0;
    while ((post != null ? post.domain : void 0) !== "i.imgur.com" && tries_to_find_picture < 30) {
      post = getPost(posts);
      tries_to_find_picture++;
    }
    
    // Send pictures with the url on one line so Campfire displays it as an image
    if (post.domain === 'i.imgur.com') {
      msg.send(`${post.title} - http://www.reddit.com${post.permalink}`);
      return msg.send(post.url);
    } else {
      return msg.send(`${post.title} - ${post.url} - http://www.reddit.com${post.permalink}`);
    }
  });
};

getPost = function(posts) {
  var random, ref;
  random = Math.round(Math.random() * posts.data.children.length);
  return (ref = posts.data.children[random]) != null ? ref.data : void 0;
};
