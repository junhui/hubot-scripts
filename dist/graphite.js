// Description:
//   Allows Hubot to search a Graphite server for saved graphs

// Dependencies:
//   None

// Configuration
//   GRAPHITE_URL (e.g. https://graphite.example.com)
//   GRAPHITE_PORT (e.g. 8443)
//   GRAPHITE_AUTH (e.g. user:password for Basic Auth)

// Commands:
//   graphite list - list all available graphs
//   graphite search <string> - search for graph by name
//   graphite show <graph.name> - output graph

// Authors:
//   obfuscurity
//   spajus
var construct_port, construct_url, human_id, treeversal;

module.exports = function(robot) {
  robot.hear(/graphite list/i, function(msg) {
    return treeversal(msg, function(data) {
      var j, len, metric, output;
      output = "";
      for (j = 0, len = data.length; j < len; j++) {
        metric = data[j];
        output += `${human_id(metric)}\n`;
      }
      return msg.send(output);
    });
  });
  robot.hear(/graphite search (\w+)/i, function(msg) {
    return treeversal(msg, function(data) {
      var j, len, metric, output;
      output = "";
      for (j = 0, len = data.length; j < len; j++) {
        metric = data[j];
        output += `${human_id(metric)}\n`;
      }
      return msg.send(output);
    });
  });
  return robot.hear(/graphite show (.+)$/i, function(msg) {
    return treeversal(msg, function(data) {
      return construct_url(msg, data[0].graphUrl, function(url) {
        return msg.send(url);
      });
    });
  });
};

construct_url = function(msg, graphUrl, cb) {
  var graphRegex, newUrl, port, proto, server, serverRegex, suffix, timestamp, uri;
  graphRegex = /(\bhttps?:\/\/)(\S+)(\/render\/\S+)$/;
  serverRegex = /(\bhttps?:\/\/)(\S+)$/;
  uri = graphUrl.match(graphRegex)[3];
  proto = process.env.GRAPHITE_URL.match(serverRegex)[1];
  server = process.env.GRAPHITE_URL.match(serverRegex)[2];
  port = construct_port();
  timestamp = '#' + new Date().getTime();
  suffix = '&.png';
  if (process.env.GRAPHITE_AUTH) {
    newUrl = proto + process.env.GRAPHITE_AUTH + '@' + server + port + uri + timestamp + suffix;
  } else {
    newUrl = proto + server + port + uri + timestamp + suffix;
  }
  return cb(newUrl);
};

treeversal = function(msg, cb, node = "") {
  var auth, data, headers, port, prefix, uri;
  data = [];
  if (node === "") {
    prefix = "*";
  } else {
    if (node.slice(-1) === '.') {
      prefix = node + "*";
    } else {
      prefix = node + ".*";
    }
  }
  port = construct_port();
  uri = `/browser/usergraph/?query=${prefix}&format=treejson&contexts=1&path=${node}&node=${node}`;
  if (process.env.GRAPHITE_AUTH) {
    auth = 'Basic ' + new Buffer(process.env.GRAPHITE_AUTH).toString('base64');
  }
  headers = {
    Accept: "application/json",
    'Content-type': 'application/json'
  };
  if (auth) {
    headers['Authorization'] = auth;
  }
  return msg.http(process.env.GRAPHITE_URL + port + uri).headers(headers).get()(function(err, res, body) {
    var i, nodes, regex;
    if (res.statusCode !== 200) {
      console.log(res);
    }
    nodes = JSON.parse(body);
    i = 0;
    while (i < nodes.length) {
      if (nodes[i].leaf === 0) {
        treeversal(msg, cb, nodes[i].id);
      } else {
        regex = new RegExp(msg.match[1], "gi");
        if (human_id(nodes[i]).search(regex) !== -1) {
          if (nodes[i].id !== "no-click") {
            data[data.length] = nodes[i];
          }
        }
      }
      i++;
    }
    if (data.length > 0) {
      return cb(data);
    }
  });
};

human_id = function(node) {
  return node.id.replace(/\.[a-z0-9]+$/, `.${node.text}`);
};

construct_port = function() {
  var port;
  port = ':';
  if (process.env.GRAPHITE_PORT) {
    port += process.env.GRAPHITE_PORT;
  } else if (process.env.GRAPHITE_URL.match(/https/)) {
    port += 443;
  } else {
    port += 80;
  }
  return port;
};
