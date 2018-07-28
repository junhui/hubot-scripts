// Description
//   display queue info from rabbitmq

// Dependencies:
//   None

// Configuration:
//   HUBOT_RABBITMQ_ROOT_URL
//   HUBOT_RABBITMQ_USER (default is 'guest')
//   HUBOT_RABBITMQ_PWD (default is 'guest')
//   HUBOT_RABBITMQ_VIRT_HOST (defaults to '/')

// Commands:
//   hubot rabbit nodes - display list of cluster nodes (name, uptime)
//   hubot rabbit vhosts - display list of vhosts
//   hubot rabbit queues - display list of queues (messages_ready, messages_unacknowledged, name)
//   hubot rabbit slow queues - display list of queues with messages.length > slow threshold
//   hubot set rabbit queues slow <threshold> - set slow queue threshold
//   hubot rabbit bindings <subscription> - display binding info for a subscription (source->destination (type) {args})

// Notes:

// Author:
//   kevwil, davidsulpy
var _queues, auth, base, base1, base2, dhm, pwd, url, user, virt;

url = process.env.HUBOT_RABBITMQ_ROOT_URL;

user = (base = process.env).HUBOT_RABBITMQ_USER != null ? base.HUBOT_RABBITMQ_USER : base.HUBOT_RABBITMQ_USER = 'guest';

pwd = (base1 = process.env).HUBOT_RABBITMQ_PWD != null ? base1.HUBOT_RABBITMQ_PWD : base1.HUBOT_RABBITMQ_PWD = 'guest';

virt = (base2 = process.env).HUBOT_RABBITMQ_VIRT_HOST != null ? base2.HUBOT_RABBITMQ_VIRT_HOST : base2.HUBOT_RABBITMQ_VIRT_HOST = '%2F';

auth = 'Basic ' + new Buffer(user + ':' + pwd).toString('base64');

_queues = {};

dhm = function(t) {
  var cd, ch, d, h, m;
  cd = 24 * 60 * 60 * 1000;
  ch = 60 * 60 * 1000;
  d = Math.floor(t / cd);
  h = '0' + Math.floor((t - d * cd) / ch);
  m = '0' + Math.round((t - d * cd - h * ch) / 60000);
  // [d, h.substr(-2), m.substr(-2)].join(':')
  return `${d}d,${h.substr(-2)}h,${m.substr(-2)}m`;
};

// get_queues = (msg) ->
//   msg
//     .http("#{url}/api/queues")
//     .query(sort_reverse: 'messages')
//     .headers(Authorization: auth, Accept: 'application/json')
//     .get() (err, res, body) ->
//       if err
//         [err, null]
//       else
//         try
//           json = JSON.parse body
//           [null, json]
//         catch e
//           [e, null]
module.exports = function(robot) {
  robot.brain.on('loaded', function() {
    if (robot.brain.data.queues != null) {
      return _queues = robot.brain.data.queues;
    }
  });
  robot.respond(/rabbit nodes/i, function(msg) {
    var results;
    results = [];
    return msg.http(`${url}/api/nodes`).headers({
      Authorization: auth,
      Accept: 'application/json'
    }).get()(function(err, res, body) {
      var e, i, json, len, node;
      if (err) {
        return msg.send(err);
      } else {
        try {
          json = JSON.parse(body);
          for (i = 0, len = json.length; i < len; i++) {
            node = json[i];
            results.push(`'${node.name}' ${dhm(node.uptime)}`);
          }
          return msg.send(results.join('\n'));
        } catch (error) {
          e = error;
          return msg.send(e);
        }
      }
    });
  });
  robot.respond(/rabbit queues/i, function(msg) {
    var results;
    results = [];
    return msg.http(`${url}/api/queues`).query({
      sort_reverse: 'messages'
    }).headers({
      Authorization: auth,
      Accept: 'application/json'
    }).get()(function(err, res, body) {
      var e, i, json, len, queue;
      if (err) {
        return msg.send(err);
      } else {
        try {
          json = JSON.parse(body);
          for (i = 0, len = json.length; i < len; i++) {
            queue = json[i];
            results.push(`${queue.messages_ready} ${queue.messages_unacknowledged} ${queue.name}`);
          }
          if ((results != null ? results.length : void 0) < 1) {
            return msg.send('no queues found');
          } else {
            return msg.send(results.join('\n'));
          }
        } catch (error) {
          e = error;
          return msg.send(e);
        }
      }
    });
  });
  robot.respond(/rabbit slow queues/i, function(msg) {
    var results;
    results = [];
    return msg.http(`${url}/api/queues`).query({
      sort_reverse: 'messages'
    }).headers({
      Authorization: auth,
      Accept: 'application/json'
    }).get()(function(err, res, body) {
      var e, i, json, len, queue;
      if (err) {
        return msg.send(err);
      } else {
        try {
          json = JSON.parse(body);
          for (i = 0, len = json.length; i < len; i++) {
            queue = json[i];
            if (queue.messages >= _queues.slow) {
              results.push(`${queue.messages_ready} ${queue.messages_unacknowledged} ${queue.name}`);
            }
          }
          if ((results != null ? results.length : void 0) < 1) {
            return msg.send('no slow queues found.');
          } else {
            return msg.send(results.join('\n'));
          }
        } catch (error) {
          e = error;
          return msg.send(e);
        }
      }
    });
  });
  robot.respond(/rabbit bindings (.*)/i, function(msg) {
    var results, sub;
    sub = msg.match[1];
    results = [];
    return msg.http(`${url}/api/queues/${virt}/${sub}/bindings`).headers({
      Authorization: auth,
      Accept: 'application/json'
    }).get()(function(err, res, body) {
      var args, binding, e, i, json, key, len, params, ref, value;
      if (err) {
        return msg.send(err);
      } else {
        try {
          json = JSON.parse(body);
          for (i = 0, len = json.length; i < len; i++) {
            binding = json[i];
            args = [];
            ref = binding.arguments;
            for (key in ref) {
              value = ref[key];
              args.push(`${key}:${value}`);
            }
            params = `{${args.join(',')}}`;
            results.push(`'${binding.source}' -> '${binding.destination}' (${binding.destination_type}) ${params}`);
          }
          if ((results != null ? results.length : void 0) < 1) {
            msg.send('no bindings found.');
          }
          return msg.send(results.join('\n'));
        } catch (error) {
          e = error;
          return msg.send(e);
        }
      }
    });
  });
  robot.respond(/rabbit vhosts/i, function(msg) {
    var results;
    results = [];
    return msg.http(`${url}/api/vhosts`).headers({
      Authorization: auth,
      Accept: 'application/json'
    }).get()(function(err, res, body) {
      var e, i, json, len, vhost;
      if (err) {
        return msg.send(err);
      } else {
        try {
          json = JSON.parse(body);
          for (i = 0, len = json.length; i < len; i++) {
            vhost = json[i];
            results.push(`'${vhost.name}'`);
          }
          return msg.send(results.join('\n'));
        } catch (error) {
          e = error;
          return msg.send(e);
        }
      }
    });
  });
  return robot.respond(/set rabbit queues slow (\d*)/i, function(msg) {
    _queues.slow = msg.match[1];
    robot.brain.data.queues = _queues;
    return msg.send("Saved.");
  });
};
