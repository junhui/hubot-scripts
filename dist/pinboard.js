  // Description:
  //   Manage your links and bookmarks. Links get stored in the robot brain while
  //   bookmarks get stored at pinboard.in. Also keeps a history of all URLs in
  //   the "urls" section of the robot brain. 

  // Dependencies:
  //   "xml2js": "0.1.14"

  // Configuration:
  //   PINBOARD_USERNAME
  //   PINBOARD_PASSWORD

  // Commands:
  //   hubot pin <url> as <description> - add a url to your pinboard feed
  //   hubot link <url> as <description> - add a url to the robot brain
  //   hubot link me for <description> - find a link by description
  //   hubot list bookmarks - get a list of the 15 most recent bookmarks
  //   hubot list links - List all of the links that are being tracked
  //   hubot feed me - get the URL to subscribe to your bookmark rss

  // Author
  //   pezholio (based on work by mm53bar)
var Bookmark, Link, Pinboard, Url,
  indexOf = [].indexOf;

module.exports = function(robot) {
  robot.respond(/feed me/i, function(msg) {
    return msg.reply(`You can subscribe to the pinboard feed at https://feeds.pinboard.in/rss/u:${process.env.PINBOARD_USERNAME}/`);
  });
  robot.respond(/list bookmarks/i, function(msg) {
    var pinboard;
    pinboard = new Pinboard(msg, process.env.PINBOARD_USERNAME, process.env.PINBOARD_PASSWORD);
    return pinboard.listBookmarks(function(err, message) {
      if (err != null) {
        return msg.send(`${err}`);
      } else {
        return msg.send(`${message}`);
      }
    });
  });
  robot.respond(/pin (http(s?)\:\/\/\S+) as (.+)/i, function(msg) {
    var bookmark, description, pinboard, url;
    pinboard = new Pinboard(msg, process.env.PINBOARD_USERNAME, process.env.PINBOARD_PASSWORD);
    url = msg.match[1];
    description = msg.match[3];
    bookmark = new Bookmark(url, description);
    return pinboard.createBookmark(bookmark, function(err, message) {
      if (err != null) {
        return msg.send(`${err}`);
      } else {
        return msg.send(`${message}`);
      }
    });
  });
  robot.respond(/link (http(s?)\:\/\/\S+) as (.+)/i, function(msg) {
    var bookmark, description, link, url;
    url = msg.match[1];
    description = msg.match[3];
    bookmark = new Bookmark(url, description);
    link = new Link(robot);
    return link.add(bookmark, function(err, message) {
      if (err != null) {
        return msg.reply("I have a vague memory of hearing about that link sometime in the past.");
      } else {
        return msg.reply("I've stuck that link into my robot brain.");
      }
    });
  });
  robot.respond(/link me for (.+)/i, function(msg) {
    var description, link;
    description = msg.match[1];
    link = new Link(robot);
    return link.find(description, function(err, bookmark) {
      if (err != null) {
        return msg.send(`${err}`);
      } else {
        return msg.send(bookmark.url);
      }
    });
  });
  robot.respond(/list links/i, function(msg) {
    var link;
    link = new Link(robot);
    return link.list(function(err, message) {
      if (err != null) {
        return msg.reply("Links? What links? I don't remember any links.");
      } else {
        return msg.reply(message);
      }
    });
  });
  return robot.hear(/(http(s?)\:\/\/\S+)/i, function(msg) {
    var href, url;
    href = msg.match[1];
    url = new Url(robot);
    return url.add(href, function(err, message) {
      if (err != null) {
        return console.log(`${href} : ${err}`);
      }
    });
  });
};

// Classes
Url = class Url {
  constructor(robot) {
    var base;
    if ((base = robot.brain.data).urls == null) {
      base.urls = [];
    }
    this.urls_ = robot.brain.data.urls;
  }

  all(url) {
    if (url) {
      return this.urls_.push(url);
    } else {
      return this.urls_;
    }
  }

  add(url, callback) {
    if (indexOf.call(this.all(), url) >= 0) {
      return callback("Url already exists");
    } else {
      this.all(url);
      return callback(null, "Url added");
    }
  }

};

Bookmark = class Bookmark {
  constructor(url, description) {
    this.url = url;
    this.description = description;
  }

  encodedUrl() {
    return encodeURIComponent(this.url);
  }

  encodedDescription() {
    return encodeURIComponent(this.description);
  }

};

Link = class Link {
  constructor(robot) {
    var base;
    if ((base = robot.brain.data).links == null) {
      base.links = [];
    }
    this.links_ = robot.brain.data.links;
  }

  all(bookmark) {
    if (bookmark) {
      return this.links_.push(bookmark);
    } else {
      return this.links_;
    }
  }

  add(bookmark, callback) {
    var result;
    result = [];
    this.all().forEach(function(entry) {
      if (entry) {
        if (entry.url === bookmark.url) {
          return result.push(bookmark);
        }
      }
    });
    if (result.length > 0) {
      return callback("Bookmark already exists");
    } else {
      this.all(bookmark);
      return callback(null, "Bookmark added");
    }
  }

  list(callback) {
    var bookmark, i, len, ref, resp_str;
    if (this.all().length > 0) {
      resp_str = "These are the links I'm remembering:\n\n";
      ref = this.all();
      for (i = 0, len = ref.length; i < len; i++) {
        bookmark = ref[i];
        if (bookmark) {
          resp_str += bookmark.description + " (" + bookmark.url + ")\n";
        }
      }
      return callback(null, resp_str);
    } else {
      return callback("No bookmarks exist");
    }
  }

  find(description, callback) {
    var result;
    result = [];
    this.all().forEach(function(bookmark) {
      if (bookmark && bookmark.description) {
        if (RegExp(description, "i").test(bookmark.description)) {
          return result.push(bookmark);
        }
      }
    });
    if (result.length > 0) {
      return callback(null, result[0]);
    } else {
      return callback("No results found");
    }
  }

};

Pinboard = class Pinboard {
  constructor(msg, user, password) {
    this.msg = msg;
    this.user = user;
    this.password = password;
  }

  feed_url() {
    return `https://feeds.pinboard.in/rss/u:${this.user}/`;
  }

  authdata() {
    return new Buffer(this.user + ':' + this.password).toString('base64');
  }

  createBookmark(bookmark, callback) {
    var api_url;
    api_url = "https://api.pinboard.in/v1/posts/add?" + `url=${bookmark.encodedUrl()}` + `&description=${bookmark.encodedDescription()}`;
    return this.getPinboard(api_url, function(err, data) {
      var result, resultRegexp;
      if ((err != null) || (data == null)) {
        return callback(err);
      } else {
        resultRegexp = /result code="(.+)"/i;
        result = data.match(resultRegexp)[1];
        if (result === 'done') {
          return callback(null, "Your bookmark was added to pinboard.");
        } else {
          return callback(`There was a problem adding your bookmark to pinboard: ${result}`);
        }
      }
    });
  }

  listBookmarks(callback) {
    var api_url, xml2js;
    xml2js = require('xml2js');
    api_url = "https://api.pinboard.in/v1/posts/recent";
    return this.getPinboard(api_url, function(err, data) {
      var resp_str;
      if ((err != null) || (data == null)) {
        return callback(err);
      } else {
        resp_str = "My bookmarks: \n";
        (new xml2js.Parser()).parseString(data, function(err, json) {
          var i, len, post, ref, results;
          ref = json.posts.post;
          results = [];
          for (i = 0, len = ref.length; i < len; i++) {
            post = ref[i];
            results.push(resp_str += post["$"].description + " (" + post["$"].href + ")\n");
          }
          return results;
        });
        return callback(null, resp_str);
      }
    });
  }

  getPinboard(api_url, callback) {
    return this.msg.http(api_url).header('Authorization', 'Basic ' + this.authdata()).get()(function(err, res, body) {
      if (res.statusCode === 200) {
        return callback(null, body);
      } else if (err != null) {
        return callback(err);
      } else {
        return callback("There were problems contacting pinboard");
      }
    });
  }

};
