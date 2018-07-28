// Description:
//   Shows the status of resque queues

// Dependencies:
//   None

// Configuration:
//   RESQUE_WEB_URL

// Commands:
//   hubot resque - Lists the queues with pending jobs

// Author:
//   joshuaflanagan
var format_stats, parse_stats;

module.exports = function(robot) {
  var url;
  url = process.env.RESQUE_WEB_URL || 'http://localhost:5678';
  return robot.respond(/resque/i, function(msg) {
    return msg.http(url + '/stats.txt').get()(function(err, res, body) {
      return msg.send(format_stats(parse_stats(body)));
    });
  });
};

parse_stats = function(stats) {
  var details, handle_line, i, len, ref, response;
  details = {};
  handle_line = function(line) {
    var group, key, name, val;
    [key, val] = line.split('=');
    [group, name] = key.split('.');
    return (details[group] || (details[group] = {}))[name.replace('+', '')] = val;
  };
  ref = stats.split('\n');
  for (i = 0, len = ref.length; i < len; i++) {
    response = ref[i];
    handle_line(response);
  }
  return details;
};

format_stats = function(stats) {
  var count, heading, justify, name, q, queue_list, queues, width;
  heading = `${stats['resque']['pending']} pending jobs. ${stats['resque']['working']} of ${stats['resque']['workers']} workers active.`;
  queues = ((function() {
    var ref, results;
    ref = stats['queues'];
    results = [];
    for (name in ref) {
      count = ref[name];
      if (count !== '0') {
        results.push([count, name]);
      }
    }
    return results;
  })()).sort(function(a, b) {
    return b[0] - a[0];
  });
  justify = function(str, size) {
    return Array(size - str.length + 1).join(' ') + str;
  };
  width = Math.max.apply(null, (function() {
    var i, len, results;
    results = [];
    for (i = 0, len = queues.length; i < len; i++) {
      q = queues[i];
      results.push(q[1].length);
    }
    return results;
  })());
  queue_list = ((function() {
    var i, len, results;
    results = [];
    for (i = 0, len = queues.length; i < len; i++) {
      q = queues[i];
      results.push(`${justify(q[1], width + 1)} : ${q[0]}`);
    }
    return results;
  })()).join('\n');
  return heading + '\n' + queue_list;
};
