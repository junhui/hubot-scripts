  // Description:
  //   evaluate code

  // Dependencies:
  //   None

  // Configuration:
  //   None

  // Commands:
  //   hubot eval me <lang> <code> - evaluate <code> and show the result
  //   hubot eval on <lang> - start recording
  //   hubot eval off|finish|done - evaluate recorded <code> and show the result
  //   hubot eval cancel - cancel recording
  //   hubot eval list - list available languages

  // Author:
  //   aanoaa
var ready, util,
  hasProp = {}.hasOwnProperty;

util = require('util');

ready = false;

module.exports = function(robot) {
  var get_languages, lang_valid, run_eval;
  get_languages = function(robot, callback) {
    var url;
    callback || (callback = function() {});
    if (!ready) {
      callback({});
      return;
    }
    url = "http://api.dan.co.jp/lleval.cgi";
    robot.logger.info(`Loading language data from ${url}`);
    return robot.http(url).query({
      q: "1"
    }).get()(function(err, res, body) {
      var langs;
      langs = JSON.parse(body);
      callback(langs);
      return robot.logger.info(`Brain received eval language list ${util.inspect(langs)}`);
    });
  };
  lang_valid = function(robot, lang, callback) {
    callback || (callback = function() {});
    return get_languages(robot, function(languages) {
      var desc, id;
      for (id in languages) {
        if (!hasProp.call(languages, id)) continue;
        desc = languages[id];
        if (lang === id) {
          callback(true);
          return;
        }
      }
      return callback(false);
    });
  };
  run_eval = function(lang, code, msg) {
    return msg.http("http://api.dan.co.jp/lleval.cgi").query({
      s: `${code}`,
      l: `${lang}`
    }).get()(function(err, res, body) {
      var out, ret;
      out = JSON.parse(body);
      ret = out.stdout || out.stderr;
      return msg.send(ret);
    });
  };
  robot.brain.on('loaded', function() {
    ready = true;
    return get_languages(robot);
  });
  robot.respond(/eval[,:]?\s+list$/i, function(msg) {
    return get_languages(robot, function(languages) {
      var desc, id, lang_msg;
      lang_msg = 'Known Languages\n\n';
      for (id in languages) {
        if (!hasProp.call(languages, id)) continue;
        desc = languages[id];
        lang_msg += `${id}: ${desc}\n`;
      }
      return msg.send(lang_msg);
    });
  });
  robot.respond(/eval[,:]? +on +([a-z]+) *$/i, function(msg) {
    var base, is_valid, lang;
    (base = robot.brain.data).eval || (base.eval = {});
    lang = msg.match[1];
    is_valid = function(valid) {
      if (!valid) {
        msg.send(`Unknown language ${lang} - use eval list command for languages`);
        return;
      }
      robot.brain.data.eval[msg.message.user.name] = {
        recording: true,
        lang: msg.match[1]
      };
      return msg.send(`OK, recording ${msg.message.user.name}'s codes for evaluate.`);
    };
    return lang_valid(robot, lang, is_valid);
  });
  robot.respond(/eval[,:]? +(?:off|finish|done) *$/i, function(msg) {
    var code, is_valid, lang, ref, ref1, ref2;
    if (!((ref = robot.brain.data.eval) != null ? (ref1 = ref[msg.message.user.name]) != null ? ref1.recording : void 0 : void 0)) {
      return;
    }
    code = (ref2 = robot.brain.data.eval[msg.message.user.name].code) != null ? ref2.join("\n") : void 0;
    lang = robot.brain.data.eval[msg.message.user.name].lang;
    is_valid = function(valid) {
      if (!valid) {
        msg.send(`Unknown language ${lang} - use eval list command for languages`);
        return;
      }
      run_eval(lang, code, msg);
      return delete robot.brain.data.eval[msg.message.user.name];
    };
    return lang_valid(robot, lang, is_valid);
  });
  robot.respond(/eval[,:]? +cancel *$/i, function(msg) {
    var ref;
    delete (((ref = robot.brain.data.eval) != null ? ref[msg.message.user.name] : void 0) != null);
    return msg.send(`canceled ${msg.message.user.name}'s evaluation recording`);
  });
  robot.respond(/eval( me)? ([^ ]+) (.+)/i, function(msg) {
    var is_valid, lang;
    lang = msg.match[2];
    if (lang === 'on' || lang === 'off' || lang === 'finish' || lang === 'done' || lang === 'cancel') {
      return;
    }
    is_valid = function(valid) {
      if (!valid) {
        msg.send(`Unknown language ${lang} - use eval list command for languages`);
        return;
      }
      return run_eval(lang, msg.match[3], msg);
    };
    return lang_valid(robot, lang, is_valid);
  });
  return robot.catchAll(function(msg) {
    var base, ref, ref1;
    if (!((ref = robot.brain.data.eval) != null ? ref[msg.message.user.name] : void 0)) {
      return;
    }
    if (robot.brain.data.eval[msg.message.user.name].recording) {
      (base = robot.brain.data.eval[msg.message.user.name]).code || (base.code = []);
      if (!((ref1 = msg.message.text) != null ? ref1.match(/eval[,:]? +on +([a-z]+) *$/i) : void 0)) {
        return robot.brain.data.eval[msg.message.user.name].code.push(msg.message.text);
      }
    }
  });
};
