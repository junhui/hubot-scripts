// Description:
//   Allows Hubot to control pandora on a squeezebox music player

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect: "0.2.0"

// Configuration:
//   SQUEEZE_BOX_EMAIL
//   SQUEEZE_BOX_PASSWORD
//   SQUEEZE_BOX_PLAYER_ID

// Commands:
//   hubot pandorame <artist, song, etc> - plays on pandora
//   hubot pause|play
//   hubot vol <positive or negative #> - changes volume
//   hubot crankit|indoor voices - volume presets
//   hubot who's playing? - lists station, artist, song
//   hubot thumbsup|thumbsdown - relay preferences to pandora

// Author:
//   kylefritz
var HTMLParser, Select, _cmd, _login, artist, get_number_of_hits, queueup, vol;

Select = require("soupselect").select;

HTMLParser = require("htmlparser");

module.exports = function(robot) {
  robot.respond(/(queue ?up|pandora ?me) (.+)/i, function(msg) {
    return queueup(msg, msg.match[2]);
  });
  robot.respond(/pause/i, function(msg) {
    _cmd(msg, ["pause"]);
    return msg.send("lips are sealed");
  });
  robot.respond(/play/i, function(msg) {
    _cmd(msg, ["play"]);
    return msg.send("resuming jam");
  });
  robot.respond(/vol \+?(\-?\d+)/i, function(msg) {
    vol(msg, parseInt(msg.match[1] || "10"));
    return msg.send("commencing volume adjustment");
  });
  robot.respond(/crank ?it/i, function(msg) {
    vol(msg, 100);
    return msg.send("oh hell yeah");
  });
  robot.respond(/indoor voices/i, function(msg) {
    vol(msg, -100, function() {
      return vol(msg, 40);
    });
    return msg.send("what do you work at a library?");
  });
  robot.respond(/wh(o|at)'?s ?(playing|this)/i, function(msg) {
    return artist(msg);
  });
  robot.respond(/\(?thumbsup\)?/i, function(msg) {
    _cmd(msg, ["pandora", "rate", 1]);
    return msg.send("glad you like it");
  });
  return robot.respond(/yuck|\(?thumbsdown\)?/i, function(msg) {
    _cmd(msg, ["pandora", "rate", 0]);
    return msg.send("seriously! who put that on?");
  });
};

_login = function(msg, cb) {
  var data, enc;
  enc = encodeURIComponent;
  data = `email=${enc(process.env.SQUEEZE_BOX_EMAIL)}&password=${enc(process.env.SQUEEZE_BOX_PASSWORD)}`;
  return msg.http("http://mysqueezebox.com/user/login").header("content-length", data.length).header("Content-Type", "application/x-www-form-urlencoded").post(data)(function(err, res, body) {
    var cookie, setString, squeeze_session;
    setString = res.headers['set-cookie'][0];
    //dirty split
    squeeze_session = setString.split('; ')[0].split('=')[1];
    cookie = `Squeezebox-player=${encodeURIComponent(process.env.SQUEEZE_BOX_PLAYER_ID)}; sdi_squeezenetwork_session=${squeeze_session}`;
    return cb(cookie);
  });
};

_cmd = function(msg, what, cb) {
  var data, json;
  data = {
    "id": 1,
    "method": "slim.request",
    "params": [process.env.SQUEEZE_BOX_PLAYER_ID, what]
  };
  json = JSON.stringify(data);
  return _login(msg, function(cookie) {
    return msg.http("http://mysqueezebox.com/jsonrpc.js").header("content-type", "application/json").header("content-length", json.length).header("cookie", cookie).post(json)(function(err, res, body) {
      if (cb != null) {
        return cb(err, res, body);
      }
    });
  });
};

queueup = function(msg, what) {
  return _login(msg, function(cookie) {
    return msg.http(`http://mysqueezebox.com/browse/Pandora/1_${encodeURIComponent(what)}`).header("cookie", cookie).get()(function(err, res, body) {
      var hits;
      if (body.match(/No items found./)) {
        return msg.send(`no dice. couldn't find "${what}".`);
      } else {
        hits = get_number_of_hits(body);
        if (hits === 1 || what[what.length - 1] === '0') {
          return artist(msg);
        } else {
          msg.send(`got ${hits} hits for ${what}, trying first`);
          return queueup(msg, `${what}.0`);
        }
      }
    });
  });
};

artist = function(msg) {
  return _cmd(msg, ["status", "-", 1, "tags:cgABbehldiqtyrSuoKLN"], function(err, res, body) {
    var r, t;
    r = JSON.parse(body).result;
    t = r.remoteMeta;
    if (t.artist) {
      msg.send(`"${t.title}" by ${t.artist} from ${t.album} @ ${r.current_title}`);
      return msg.send(`${t.artwork_url}`);
    } else {
      return msg.send(`playing ${r.current_title}`);
    }
  });
};

vol = function(msg, amt, cb) {
  var change, delt;
  delt = amt > 0 ? "+" : "";
  change = `${delt}${amt}`;
  return _cmd(msg, ["mixer", "volume", change], cb);
};

get_number_of_hits = function(body) {
  var html_handler, html_parser;
  html_handler = new HTMLParser.DefaultHandler((function() {}), {
    ignoreWhitespace: true
  });
  html_parser = new HTMLParser.Parser(html_handler);
  html_parser.parseComplete(body);
  return Select(html_handler.dom, '.inline.text').length;
};
