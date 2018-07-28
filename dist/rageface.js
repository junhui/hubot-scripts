// Description:
//   Rage face script

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot rage <tag> - Send a rageface for a given tag, if no tag is given, one will be chosen at random

// Author:
//   brianmichel
var emotions, rageFacesCall;

Array.prototype.shuffle = function() {
  return this.sort(function() {
    return 0.5 - Math.random();
  });
};

String.prototype.strip = function() {
  if (String.prototype.trim != null) {
    return this.trim();
  } else {
    return this.replace(/^\s+|\s+$/g, "");
  }
};

emotions = ["happy", "rage", "AW YEAH", "money", "cereal", "guy", "accepted", "derp", "fuck"];

module.exports = function(robot) {
  return robot.respond(/(rage)( .*)?/i, function(msg) {
    var tag;
    tag = msg.match[2] ? msg.match[2] : msg.random(emotions);
    return rageFacesCall(msg, tag, function(image_url) {
      return msg.send(image_url);
    });
  });
};

rageFacesCall = function(msg, tag, cb) {
  var encoded_tag, rage_faces_url;
  encoded_tag = encodeURI(tag.strip());
  rage_faces_url = "http://ragefac.es/api/tag/" + encoded_tag;
  return msg.http(rage_faces_url).get()(function(err, res, body) {
    var items, json_body;
    json_body = JSON.parse(body);
    items = json_body.items.shuffle();
    return cb(items.length > 1 ? items[0].face_url : "Unable to rage");
  });
};
