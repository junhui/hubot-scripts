// Description:
//   List stories and other items in Sprint.ly and interact with them

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot sprintly [product_id] [status] [limit] - list items in status (default status is in-progress, other values: backlog, completed, accepted; default limit is 20)
//   hubot sprintly [product_id] mine - list items assigned to me
//   hubot sprintly [product_id] #42 - show item #42
//   hubot sprintly [product_id] #42 tasks - list unfinished subtasks of story #42
//   hubot sprintly [product_id] <action> #42 - carry out action on item #42 (available actions: start, stop, finish, accept, reject, delete)
//   hubot sprintly [product_id] [environment] deploy 4,8,15,16,23,42 - mark items as deployed to an environment
//   hubot sprintly token <email:apitoken> - set/update credentials for user (required for other commands to work)
//   hubot sprintly default 1234 - set default product_id
//   hubot sprintly default_env production - set default environment (used for deploy)

// Author:
//   lackac
var DummyClient, formatItems, i, itemSummary, j, len, len1, method, qs, ref, ref1, self, sprintly, sprintlyUser, withUserId;

qs = require('querystring');

module.exports = function(robot) {
  robot.respond(/sprintly +token +(.*)/i, function(msg) {
    return sprintly(msg, msg.match[1]).scope('products.json').get()(function(err, res, body) {
      if (res.statusCode < 400) {
        sprintlyUser(msg).auth = msg.match[1];
        return msg.send("API token set");
      } else {
        return msg.send(`Unable to verify API token: ${body}`);
      }
    });
  });
  robot.respond(/sprintly +default +(\d+) *$/i, function(msg) {
    var base;
    if ((base = robot.brain.data).sprintly == null) {
      base.sprintly = {};
    }
    robot.brain.data.sprintly.product_id = msg.match[1];
    return msg.send(`Default Product ID set to ${msg.match[1]}`);
  });
  robot.respond(/sprintly +default_env +(.*)/i, function(msg) {
    var base;
    if ((base = robot.brain.data).sprintly == null) {
      base.sprintly = {};
    }
    robot.brain.data.sprintly.env = msg.match[1];
    return msg.send(`Default environment set to ${msg.match[1]}`);
  });
  robot.respond(/sprintly *(?: +(\d+))?(?: +(backlog|in-progress|completed|accepted))?(?: +(\d+))? *$/i, function(msg) {
    var query, ref;
    query = {
      status: (ref = msg.match[2]) != null ? ref : 'in-progress'
    };
    if (msg.match[3]) {
      query.limit = msg.match[3];
    }
    return sprintly(msg).product().scope('items.json').query(query).get()(formatItems(msg));
  });
  robot.respond(/sprintly +(?:(\d+) +)?mine *$/i, function(msg) {
    return withUserId(msg, function(user_id) {
      return sprintly(msg).product().scope('items.json').query({
        assigned_to: user_id
      }).get()(formatItems(msg));
    });
  });
  robot.respond(/sprintly +(?:(\d+) +)?#(\d+) *$/i, function(msg) {
    return sprintly(msg).product().scope(`items/${msg.match[2]}.json`).get()(function(err, res, body) {
      var item, meta, u;
      if (res.statusCode === 200) {
        item = JSON.parse(body);
        msg.send(itemSummary(item));
        if (item.description) {
          msg.send(item.description);
        }
        meta = [`status: ${item.status}`, `assigned_to: ${((u = item.assigned_to) ? `${u.first_name} ${u.last_name}` : "nobody")}`, `created by: ${item.created_by.first_name} ${item.created_by.last_name}`];
        if (item.tags && item.tags.length > 0) {
          meta.push(`tags: ${item.tags.join(", ")}`);
        }
        return msg.send(meta.join(", "));
      } else {
        return msg.send(`Something came up: ${body}`);
      }
    });
  });
  robot.respond(/sprintly +(?:(\d+) +)?#(\d+) +tasks *$/i, function(msg) {
    return sprintly(msg).product().scope(`items/${msg.match[2]}/children.json`).get()(formatItems(msg, true));
  });
  robot.respond(/sprintly +(?:(\d+) +)?(start|stop|finish|accept|reject|delete) +#?(\d+) *$/i, function(msg) {
    return withUserId(msg, function(user_id) {
      var method, query;
      query = {};
      method = 'post';
      switch (msg.match[2]) {
        case 'start':
          query.status = 'in-progress';
          query.assigned_to = user_id;
          break;
        case 'stop':
          query.status = 'backlog';
          break;
        case 'finish':
          query.status = 'completed';
          break;
        case 'accept':
          query.status = 'accepted';
          break;
        case 'reject':
          query.status = 'in-progress';
          break;
        case 'delete':
          method = 'delete';
      }
      return sprintly(msg).product().scope(`items/${msg.match[3]}.json`)[method](qs.stringify(query))(function(err, res, body) {
        var item;
        if (res.statusCode < 400) {
          item = JSON.parse(body);
          if (msg.match[2] === 'delete') {
            return msg.send(`#${item.number} has been archived`);
          } else {
            return msg.send(`#${item.number} status: ${item.status}`);
          }
        } else {
          return msg.send(`Something came up: ${body}`);
        }
      });
    });
  });
  return robot.respond(/sprintly *(?: +(\d+))?(?: +(.*))?deploy +([\d]+(,[\d]+)*)/i, function(msg) {
    var query, ref, ref1;
    query = {
      environment: (ref = msg.match[2]) != null ? ref : (ref1 = msg.robot.brain.data.sprintly) != null ? ref1.env : void 0,
      numbers: msg.match[3]
    };
    if (query.environment != null) {
      return sprintly(msg).product().scope('deploys.json').post(qs.stringify(query))(function(err, res, body) {
        var apiRes;
        if (res.statusCode < 400) {
          apiRes = JSON.parse(body);
          return msg.send(`Successfully marked ${apiRes.items.length} items as deployed`);
        } else {
          return msg.send(`Something came up: ${body}`);
        }
      });
    } else {
      return msg.send("No environment has been specified, you can set a default with 'sprintly default_env production'");
    }
  });
};

DummyClient = function() {};

self = function() {
  return this;
};

ref = ['scope', 'query', 'product'];
for (i = 0, len = ref.length; i < len; i++) {
  method = ref[i];
  DummyClient.prototype[method] = self;
}

ref1 = ['get', 'post', 'put', 'delete'];
for (j = 0, len1 = ref1.length; j < len1; j++) {
  method = ref1[j];
  DummyClient.prototype[method] = function() {
    return self;
  };
}

sprintlyUser = function(msg) {
  var base, name, sp;
  sp = (base = msg.robot.brain.data).sprintly != null ? base.sprintly : base.sprintly = {};
  return sp[name = msg.message.user.id] != null ? sp[name] : sp[name] = {};
};

sprintly = function(msg, auth) {
  var client;
  if (auth != null ? auth : auth = sprintlyUser(msg).auth) {
    client = msg.robot.http('https://sprint.ly').header('accept', 'application/json').header('authorization', `Basic ${new Buffer(auth).toString('base64')}`).path('/api');
    client.product = function() {
      var product_id, ref2, ref3;
      if (product_id = (ref2 = msg.match[1]) != null ? ref2 : (ref3 = msg.robot.brain.data.sprintly) != null ? ref3.product_id : void 0) {
        return this.path(`/api/products/${product_id}`);
      } else {
        msg.send("No Product Id has been specified, you can set a default with 'sprintly default 1234'");
        return new DummyClient();
      }
    };
    return client;
  } else {
    msg.send("API token not found, set it with 'sprintly token <email:apitoken>'");
    return new DummyClient();
  }
};

itemSummary = function(item, subtask = false) {
  var parts;
  parts = [`#${item.number}`];
  if (!subtask) {
    parts.push(`(${item.score})`);
  }
  if ((!subtask && item.type !== 'story') || (subtask && item.type !== 'task')) {
    parts.push(`${item.type}:`);
  }
  parts.push(item.title);
  parts.push(`https://sprint.ly/#!/product/${item.product.id}/item/${item.number}`);
  return parts.join(" ");
};

formatItems = function(msg, subtasks = false) {
  var no_items_msg;
  no_items_msg = subtasks ? "No subtasks" : "No items";
  return function(err, res, body) {
    var item, k, len2, payload, ref2, results;
    if (res.statusCode === 200) {
      payload = JSON.parse(body);
      if (payload.length > 0) {
        results = [];
        for (k = 0, len2 = payload.length; k < len2; k++) {
          item = payload[k];
          if (!subtasks || ((ref2 = item.status) === 'backlog' || ref2 === 'in-progress')) {
            results.push(msg.send(itemSummary(item, subtasks)));
          }
        }
        return results;
      } else {
        return msg.send(no_items_msg);
      }
    } else {
      return msg.send(`Something came up: ${body}`);
    }
  };
};

withUserId = function(msg, callback) {
  var user;
  user = sprintlyUser(msg);
  if (user.user_id) {
    return callback(user.user_id);
  } else {
    return sprintly(msg).product().scope('people.json').get()(function(err, res, body) {
      var email, id, k, len2, payload, results, user_email;
      if (res.statusCode === 200) {
        payload = JSON.parse(body);
        user_email = user.auth.split(':')[0];
        results = [];
        for (k = 0, len2 = payload.length; k < len2; k++) {
          ({id, email} = payload[k]);
          if (!(email === user_email)) {
            continue;
          }
          user.user_id = id;
          callback(id);
          break;
        }
        return results;
      } else {
        return msg.send(`Something came up: ${body}`);
      }
    });
  }
};
