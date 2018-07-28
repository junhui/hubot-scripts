// Description:
//   Fetches graylog messages via Hubot

// Dependencies:
//   None

// Configuration
//   GRAYLOG_URL (e.g. https://graylog.example.com)
//   GRAYLOG_API_TOKEN (e.g. 098f6bcd4621d373cade4e832627b4f6)
//   GRAYLOG_SEPARATOR (e.g. ','. Default: "\n")

// Commands:
//   hubot graylog - output last 5 graylog messages
//   hubot graylog <count> - output last <count> graylog messages
//   hubot graylog streams - list graylog streams
//   hubot graylog hosts - list graylog hosts
//   hubot graylog <stream> <count> - output some messages from given stream
//   hubot graylog host <host> <count> - output some messages from given host

// Notes
//   Output format: "[timestamp] message content"

// Author:
//   spajus
var graylogHostList, graylogHostMessages, graylogHosts, graylogList, graylogMessages, graylogStreamList, graylogStreamMessages, graylogStreams, graylogUrl, sayMessages, separator;

module.exports = function(robot) {
  robot.respond(/graylog streams$/i, function(msg) {
    return graylogStreams(msg, function(what) {
      return msg.send(what);
    });
  });
  robot.respond(/graylog hosts$/i, function(msg) {
    return graylogHosts(msg, function(what) {
      return msg.send(what);
    });
  });
  robot.respond(/graylog$/i, function(msg) {
    return graylogStreamMessages(msg, 'all', 5, function(what) {
      return msg.send(what);
    });
  });
  robot.respond(/graylog (\d+)$/i, function(msg) {
    var count;
    count = parseInt(msg.match[1] || '5');
    return graylogMessages(msg, 'messages.json', function(messages) {
      return sayMessages(messages, count, function(what) {
        return msg.send(what);
      });
    });
  });
  robot.respond(/graylog (.+) (\d+)/i, function(msg) {
    var count, stream;
    stream = msg.match[1];
    count = parseInt(msg.match[2] || '5');
    return graylogStreamMessages(msg, stream, count, function(what) {
      return msg.send(what);
    });
  });
  return robot.respond(/graylog host (.+) (\d+)/i, function(msg) {
    var count, host;
    host = msg.match[1];
    count = parseInt(msg.match[2] || '5');
    return graylogHostMessages(msg, host, count, function(what) {
      return msg.send(what);
    });
  });
};

graylogStreamMessages = function(msg, stream_title, count, cb) {
  stream_title = stream_title.toLowerCase();
  if (stream_title === 'all') {
    return graylogMessages(msg, 'messages.json', function(messages) {
      return sayMessages(messages, count, cb);
    });
  } else {
    return graylogStreamList(msg, function(streams) {
      var i, len, lstream, stream, url;
      for (i = 0, len = streams.length; i < len; i++) {
        stream = streams[i];
        lstream = stream.title.toLowerCase();
        if (lstream === stream_title) {
          url = `streams/${stream._id}-${stream.title}/messages.json`;
          graylogMessages(msg, url, function(messages) {
            return sayMessages(messages, count, cb);
          });
          return;
        }
      }
    });
  }
};

graylogHostMessages = function(msg, host_name, count, cb) {
  var url;
  url = `hosts/${host_name}/messages.json`;
  return graylogMessages(msg, url, function(messages) {
    return sayMessages(messages, count, cb);
  });
};

graylogMessages = function(msg, url, cb) {
  return graylogList(msg, url, cb);
};

sayMessages = function(messages, count, cb) {
  var i, len, message, said;
  said = 0;
  for (i = 0, len = messages.length; i < len; i++) {
    message = messages[i];
    said += 1;
    cb(`[${message.histogram_time}] ${message.message}`);
    if (said >= count || said === 20) {
      return;
    }
  }
  if (said < 1) {
    return cb("No graylog messages");
  }
};

graylogUrl = function(path) {
  return `${process.env.GRAYLOG_URL}/${path}?api_key=${process.env.GRAYLOG_API_TOKEN}`;
};

separator = function() {
  return process.env.GRAYLOG_SEPARATOR || "\n";
};

graylogStreams = function(msg, cb) {
  return graylogStreamList(msg, function(streams) {
    var i, len, stream, stream_titles;
    stream_titles = [];
    for (i = 0, len = streams.length; i < len; i++) {
      stream = streams[i];
      stream_titles.push(stream.title);
    }
    return cb(`Graylog streams: ${stream_titles.join(separator())}`);
  });
};

graylogStreamList = function(msg, cb) {
  return graylogList(msg, 'streams.json', cb);
};

graylogHostList = function(msg, cb) {
  return graylogList(msg, 'hosts.json', cb);
};

graylogList = function(msg, url, cb) {
  url = graylogUrl(url);
  return msg.robot.http(url).get()(function(err, res, body) {
    if (res.statusCode !== 200) {
      console.log('Error requesting Graylog url', url, body);
      return;
    }
    return cb(JSON.parse(body));
  });
};

graylogHosts = function(msg, cb) {
  return graylogHostList(msg, function(hosts) {
    var host, host_names, i, len;
    host_names = [];
    for (i = 0, len = hosts.length; i < len; i++) {
      host = hosts[i];
      host_names.push(`${host.host} (${host.message_count})`);
    }
    return cb(`Graylog hosts: ${host_names.join(separator())}`);
  });
};
