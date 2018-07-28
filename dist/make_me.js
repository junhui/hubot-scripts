// Description
//   Companion Hubot script for operating
//   https://github.com/make-me/make-me/

// Dependencies:
//   None

// Configuration:
//   The make-me HTTP server location, username and password
//   can be configured from the enviornment with `$HUBOT_MAKE_ME_URL`,
//   `$HUBOT_MAKE_ME_USER` and `$HUBOT_MAKE_ME_PASS`

// Commands:
//   hubot 3d me <url..url_n> [options] - 3D Print the URLs
//   hubot 3d? - Show some help

// Notes:
//   None

// Author:
//   @sshirokov and @skalnik
var auth64, authPass, authUser, makeServer, qs, util;

util = require('util');

qs = require('querystring');

makeServer = process.env.HUBOT_MAKE_ME_URL || 'http://localhost:9292';

[authUser, authPass] = [process.env.HUBOT_MAKE_ME_USER || 'hubot', process.env.HUBOT_MAKE_ME_PASS || 'isalive'];

auth64 = (new Buffer(`${authUser}:${authPass}`)).toString("base64");

module.exports = function(robot) {
  robot.respond(/3d\??$/i, function(msg) {
    var response;
    response = `${robot.name} 3d me [STL URLs] [[options]] - prints an STL file\nYou can list multiple URLs separated by spaces.\n\n  Options can follow the URL and are:\n    '(high|medium|low) quality' -- sets the quality of the print. Default: medium\n    'xN' (e.g. x2)              -- print more than one of a thing at once\n    'with supports'             -- adds supports to the model, for complex overhangs. Default: disabled\n    'with raft'                 -- prints on a plastic raft, for models with little platform contact. Default: disabled\n    'xx% solid'                 -- changes how solid the object is on the inside. Default: 5%\n    'scale by X.Y' (e.g. 0.5)   -- scale the size of the model by a factor\n\n${robot.name} 3d snapshot - takes a picture and tells you the locked status\n${robot.name} 3d unlock - unlocks the printer after you clean up\n\nOnly 1 print at a time is allowed, and you are required to tell\n${robot.name} after you've cleaned your print off.\n\nThe web frontend is at ${makeServer}, and\nthe most current log is always available at ${makeServer}/log`;
    return msg.send(response);
  });
  robot.respond(/3d (snapshot|status)/i, function(msg) {
    var locked_msg;
    locked_msg = "unlocked";
    return msg.http(makeServer + "/lock").header("Authorization", `Basic ${auth64}`).get()((err, res, body) => {
      if (res.statusCode === 423) {
        locked_msg = "locked";
      }
      return msg.http(makeServer).scope('photo.json').get()((err, res, body) => {
        var i, image, images, len, ref, results;
        if (res.statusCode === 200) {
          msg.reply(`I can't see anything, what does it look like to you? I hear the machine is ${locked_msg}.`);
          images = (ref = JSON.parse(body)) != null ? ref.images : void 0;
          results = [];
          for (i = 0, len = images.length; i < len; i++) {
            image = images[i];
            results.push(msg.send(image));
          }
          return results;
        } else {
          return msg.reply(`I can't seem to get a hold of a picture for you, but the internets tell me the machine is ${locked_msg}.`);
        }
      });
    });
  });
  robot.respond(/3d unlock( me)?/i, function(msg) {
    return msg.http(makeServer + "/lock").header("Authorization", `Basic ${auth64}`).post(qs.encode({
      "_method": "DELETE"
    }))((err, res, body) => {
      if (res.statusCode === 200) {
        return msg.reply("Oh you finally decided to clean up?");
      } else if (res.statusCode === 404) {
        return msg.reply("There's no lock. Go print something awesome!");
      } else {
        msg.reply(`Unexpected status code ${res.statusCode}!`);
        return msg.reply(body);
      }
    });
  });
  return robot.respond(/(3d|make)( me)?( a)? (http[^\s]+)\s*(.*)/i, function(msg) {
    var count, count_op, density, density_op, options, quality, quality_op, raft, reply, scale, scale_op, supports, things, url;
    things = [msg.match[4]];
    count = 1;
    scale = 1.0;
    supports = false;
    raft = false;
    quality = 'medium';
    density = 0.05;
    options = msg.match[5];
    // Extract any extra urls
    while (url = /(http[^\s]+)\s?/.exec(options)) {
      things.push(url[1]);
      options = options.slice(url[1].length + 1);
    }
    if (count_op = /x(\d+)/.exec(options)) {
      count = parseInt(count_op[1]);
    }
    if (/with support/.exec(options)) {
      supports = true;
    }
    if (/with raft/.exec(options)) {
      raft = true;
    }
    if (quality_op = /(\w+) quality/.exec(options)) {
      quality = quality_op[1];
    }
    if (density_op = /(\d+)% solid/.exec(options)) {
      density = parseFloat(density_op[1]) / 100.0;
    }
    if (scale_op = /scale by (\d+\.\d+)/.exec(options)) {
      scale = parseFloat(scale_op[1]);
    }
    reply = `Telling the 3D printer to print ${things.length} models`;
    if (options.length > 0) {
      reply += ` with the options: ${options}`;
    }
    msg.reply(reply);
    return msg.http(makeServer + "/print").header("Authorization", `Basic ${auth64}`).post(JSON.stringify({
      url: things,
      count: count,
      scale: scale,
      quality: quality,
      density: density,
      slicer_args: {
        doSupport: supports,
        doRaft: raft
      }
    }))((err, res, body) => {
      if (res.statusCode === 200) {
        return msg.reply(`Your thing is printin'! Check logs at ${makeServer}`);
      } else if (res.statusCode === 409) {
        return msg.reply("I couldn't process that pile of triangles.");
      } else if (res.statusCode === 423) {
        return msg.reply(`Wait your turn, someone is already printing a thing. You can check progress at ${makeServer}`);
      } else if (err || res.statusCode === 500) {
        return msg.reply("Something broke!");
      }
    });
  });
};
