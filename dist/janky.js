// Description:
//   Janky API integration. https://github.com/github/janky

// Dependencies:
//   None

// Configuration:
//   HUBOT_JANKY_URL

// Commands:
//   hubot ci - show usage

// Author:
//   sr
var HTTP, URL, buildStatusMessage, buildsStatus, defaultOptions, del, get, post, put, url;

URL = require("url");

url = URL.parse(process.env.HUBOT_JANKY_URL);

HTTP = require(url.protocol.replace(/:$/, ""));

defaultOptions = function() {
  var auth, template;
  auth = new Buffer(url.auth).toString("base64");
  return template = {
    host: url.hostname,
    port: url.port || 80,
    path: url.pathname,
    headers: {
      "Authorization": `Basic ${auth}`
    }
  };
};

buildsStatus = function(builds) {
  var buildsLength, response;
  buildsLength = builds.length;
  response = "";
  if (buildsLength > 0) {
    builds.forEach(function(build) {
      response += buildStatusMessage(build);
      if (buildsLength > 1) {
        return response += "\n";
      }
    });
  }
  return response;
};

buildStatusMessage = function(build) {
  var response;
  response = "";
  response += `Build #${build.number} (${build.sha1}) of ${build.repo}/${build.branch} ${build.status}`;
  response += `(${build.duration}s) ${build.compare}`;
  return response += ` [Log: ${build.web_url} ]`;
};

get = function(path, params, cb) {
  var options, req;
  options = defaultOptions();
  options.path += path;
  console.log(options);
  req = HTTP.request(options, function(res) {
    var body;
    body = "";
    res.setEncoding("utf8");
    res.on("data", function(chunk) {
      return body += chunk;
    });
    return res.on("end", function() {
      return cb(null, res.statusCode, body);
    });
  });
  req.on("error", function(e) {
    console.log(e);
    return cb(e, 500, "Client Error");
  });
  return req.end();
};

put = function(path, params, cb) {
  return post(path, params, cb, 'PUT');
};

post = function(path, params, cb, method = 'POST') {
  var bodyParams, options, req;
  bodyParams = JSON.stringify(params);
  options = defaultOptions();
  options.path = `/_hubot/${path}`;
  options.method = method;
  options.headers['Content-Length'] = bodyParams.length;
  req = HTTP.request(options, function(res) {
    var body;
    body = "";
    res.setEncoding("utf8");
    res.on("data", function(chunk) {
      return body += chunk;
    });
    return res.on("end", function() {
      return cb(null, res.statusCode, body);
    });
  });
  req.on("error", function(e) {
    console.log(e);
    return cb(e, 500, "Client Error");
  });
  return req.end(bodyParams);
};

del = function(path, params, cb) {
  return post(path, params, cb, 'DELETE');
};

module.exports = function(robot) {
  robot.respond(/ci\??$/i, function(msg) {
    return get("help", {}, function(err, statusCode, body) {
      if (statusCode === 200) {
        return msg.send(body);
      } else {
        return msg.reply(`Unable to fetch help. Got HTTP status ${statusCode}`);
      }
    });
  });
  robot.respond(/ci build ([-_\.0-9a-zA-Z]+)(\/([-_\+\.a-zA-z0-9\/]+))?/i, function(msg) {
    var app, branch, room_id, user;
    app = msg.match[1];
    branch = msg.match[3] || "master";
    room_id = msg.message.user.room;
    user = msg.message.user.name.replace(/\ /g, "+");
    return post(`${app}/${branch}?room_id=${room_id}&user=${user}`, {}, function(err, statusCode, body) {
      var response;
      if (statusCode === 201 || statusCode === 404) {
        response = body;
      } else {
        console.log(body);
        response = `Can't go HAM on ${app}/${branch}, shit's being weird. Got HTTP status ${statusCode}`;
      }
      return msg.send(response);
    });
  });
  robot.respond(/ci setup ([\.\-\/_a-z0-9]+)(\s([\.\-_a-z0-9]+)(\s([\.\-_a-z0-9]+))?)?/i, function(msg) {
    var nwo, params;
    nwo = msg.match[1];
    params = `?nwo=${nwo}`;
    if (msg.match[3] !== void 0) {
      params += `&name=${msg.match[3]}`;
      if (msg.match[5] !== void 0) {
        params += `&template=${msg.match[5]}`;
      }
    }
    return post(`setup${params}`, {}, function(err, statusCode, body) {
      if (statusCode === 201) {
        return msg.reply(body);
      } else {
        return msg.reply(`Can't Setup. Make sure I have access to it. Expected HTTP status 201, got ${statusCode}`);
      }
    });
  });
  robot.respond(/ci toggle ([-_\.0-9a-zA-Z]+)/i, function(msg) {
    var app;
    app = msg.match[1];
    return post(`toggle/${app}`, {}, function(err, statusCode, body) {
      if (statusCode === 200) {
        return msg.send(body);
      } else {
        return msg.reply(`Failed to flip the flag. Sorry. Got HTTP status ${statusCode}`);
      }
    });
  });
  robot.respond(/ci set room ([-_0-9a-zA-Z\.]+) (.*)$/i, function(msg) {
    var repo, room;
    repo = msg.match[1];
    room = encodeURIComponent(msg.match[2]);
    return put(`${repo}?room=${room}`, {}, function(err, statusCode, body) {
      if ([404, 403, 200].indexOf(statusCode) > -1) {
        return msg.send(body);
      } else {
        return msg.send(`I couldn't update the room. Got HTTP status ${statusCode}`);
      }
    });
  });
  robot.respond(/ci set context ([-_0-9a-zA-Z\.]+) (.*)$/i, function(msg) {
    var context, repo;
    repo = msg.match[1];
    context = encodeURIComponent(msg.match[2]);
    return put(`${repo}/context?context=${context}`, {}, function(err, statusCode, body) {
      if ([404, 403, 200].indexOf(statusCode) > -1) {
        return msg.send(body);
      } else {
        return msg.send(`I couldn't update the context. Got HTTP status ${statusCode}`);
      }
    });
  });
  robot.respond(/ci unset context ([-_0-9a-zA-Z\.]+)$/i, function(msg) {
    var repo;
    repo = msg.match[1];
    return del(`${repo}/context`, {}, function(err, statusCode, body) {
      if ([404, 403, 200].indexOf(statusCode) > -1) {
        return msg.send(body);
      } else {
        return msg.send(`I couldn't update the context. Got HTTP status ${statusCode}`);
      }
    });
  });
  robot.respond(/ci rooms$/i, function(msg) {
    return get("rooms", {}, function(err, statusCode, body) {
      var rooms;
      if (statusCode === 200) {
        rooms = JSON.parse(body);
        return msg.reply(rooms.join(", "));
      } else {
        return msg.reply("can't predict rooms now.");
      }
    });
  });
  robot.respond(/ci builds ([0-9]+) ?(building)?$/i, function(msg) {
    var building, limit;
    limit = msg.match[1];
    building = msg.match[2] != null;
    return get(`builds?limit=${limit}&building=${building}`, {}, function(err, statusCode, body) {
      var builds, response;
      builds = JSON.parse(body);
      response = buildsStatus(builds) || "Builds? Sorry, there's no builds here";
      return msg.send(response);
    });
  });
  robot.respond(/ci status( (\*\/[-_\+\.a-zA-z0-9\/]+))?$/i, function(msg) {
    var path;
    path = msg.match[2] ? `/${msg.match[2]}` : "";
    return get(path, {}, function(err, statusCode, body) {
      if (statusCode === 200) {
        return msg.send(body);
      } else {
        return msg.send(`Couldn't get status. Got HTTP status ${statusCode}`);
      }
    });
  });
  robot.respond(/ci status (-v )?([-_\.0-9a-zA-Z]+)(\/([-_\+\.a-zA-z0-9\/]+))?/i, function(msg) {
    var app, branch, count;
    app = msg.match[2];
    count = 5;
    branch = msg.match[4] || 'master';
    if (msg.match[1] == null) {
      count = 1;
    }
    return get(`${app}/${branch}?limit=${count}`, {}, function(err, statusCode, body) {
      var builds, response;
      builds = JSON.parse(body);
      response = buildsStatus(builds) || `Sorry, no builds found for ${app}/${branch}`;
      return msg.send(response);
    });
  });
  robot.router.post("/janky", function(req, res) {
    robot.messageRoom(req.body.room, req.body.message);
    return res.end("ok");
  });
  robot.respond(/ci show ([-_\.0-9a-zA-Z]+)/i, function(msg) {
    var app;
    app = msg.match[1];
    return get(`show/${app}`, {}, function(err, statusCode, body) {
      var key, lines, replyMsg, repo, response, val;
      if (statusCode === 200) {
        repo = JSON.parse(body);
        lines = (function() {
          var results;
          results = [];
          for (key in repo) {
            val = repo[key];
            results.push(`${key}: ${val}`);
          }
          return results;
        })();
        response = lines.join("\n");
        return msg.send(response);
      } else {
        replyMsg = `Error F7U12: Can't show: ${statusCode}: ${body}`;
        return msg.reply(replyMsg);
      }
    });
  });
  return robot.respond(/ci delete ([-_\.0-9a-zA-Z]+)/i, function(msg) {
    var app;
    app = msg.match[1];
    return del(`${app}`, {}, function(err, statusCode, body) {
      if (statusCode !== 200) {
        msg.reply(`I got an error removing ${app}; sometimes deleting all the old commits/branches times out the unicorn. Maybe try again?`);
      }
      return msg.send(body);
    });
  });
};
