// Description:
//   Define new responders on the fly.

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot responders - List all responders
//   hubot responder /pattern/ - Show a responder
//   hubot forget /pattern/ - Remove a responder
//   hubot respond /pattern/ msg.send(...) - Create a new responder

// Notes:
//   It's possible to crash Hubot with this script. Comparing pathological
//   strings against evil regular expressions will crash Hubot. Callbacks with
//   infinite loops will crash Hubot. So, you know, don't do that. For example,
//   this is bad: "Hubot: respond /(a+)+/ while(1);".

// Author:
//   tfausak
var Responders;

Responders = class Responders {
  constructor(robot1) {
    this.robot = robot1;
    this.robot.brain.data.responders = {};
    this.robot.brain.on('loaded', (data) => {
      var pattern, ref, responder, results;
      ref = data.responders;
      results = [];
      for (pattern in ref) {
        responder = ref[pattern];
        delete responder.index;
        results.push(this.add(pattern, responder.callback));
      }
      return results;
    });
  }

  responders() {
    return this.robot.brain.data.responders;
  }

  responder(pattern) {
    return this.responders()[pattern];
  }

  remove(pattern) {
    var responder;
    responder = this.responder(pattern);
    if (responder) {
      if (responder.index) {
        this.robot.listeners.splice(responder.index, 1, (function() {}));
      }
      delete this.responders()[pattern];
    }
    return responder;
  }

  add(pattern, callback) {
    var error, eval_callback, eval_pattern;
    try {
      eval_pattern = eval(`/${pattern}/i`);
    } catch (error1) {
      error = error1;
      eval_pattern = null;
    }
    try {
      eval_callback = eval(`_ = function (msg) { ${callback} }`);
    } catch (error1) {
      error = error1;
      eval_callback = null;
    }
    if (eval_pattern instanceof RegExp && eval_callback instanceof Function) {
      this.remove(pattern);
      this.robot.respond(eval_pattern, eval_callback);
      this.responders()[pattern] = {
        callback: callback,
        index: this.robot.listeners.length - 1
      };
      return this.responder(pattern);
    }
  }

};

module.exports = function(robot) {
  var responders;
  responders = new Responders(robot);
  robot.respond(/responders/i, function(msg) {
    var i, len, pattern, patterns, response;
    patterns = Object.keys(responders.responders()).sort();
    if (patterns.length) {
      response = '';
      for (i = 0, len = patterns.length; i < len; i++) {
        pattern = patterns[i];
        response += `/${pattern}/ ${(responders.responder(pattern).callback)}\n`;
      }
      return msg.send(response.trim());
    } else {
      return msg.send("I'm not responding to anything.");
    }
  });
  robot.respond(/responder \/(.+)\//i, function(msg) {
    var pattern, responder;
    pattern = msg.match[1];
    responder = responders.responder(pattern);
    if (responder) {
      return msg.send(responder.callback);
    } else {
      return msg.send(`I'm not responding to /${pattern}/.`);
    }
  });
  robot.respond(/forget \/(.+)\//i, function(msg) {
    var pattern, responder;
    pattern = msg.match[1];
    responder = responders.remove(pattern);
    if (responder) {
      return msg.send(`I'll stop responding to /${pattern}/.`);
    } else {
      return msg.send(`I wasn't responding to /${pattern}/ anyway.`);
    }
  });
  return robot.respond(/respond \/(.+)\/ ([^]+)/i, function(msg) {
    var callback, pattern, responder;
    pattern = msg.match[1];
    callback = msg.match[2];
    responder = responders.add(pattern, callback);
    if (responder) {
      return msg.send(`I'll start responding to /${pattern}/.`);
    } else {
      return msg.send(`I'd like to respond to /${pattern}/ but something went wrong.`);
    }
  });
};
