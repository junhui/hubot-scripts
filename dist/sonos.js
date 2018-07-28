// Description:
//   None

// Dependencies:
//   "xml2js": "0.1.14"

// Configuration:
//   HUBOT_SONOS_HOST

// Commands:
//   hubot what's playing - show what's playing on the office Sonos

// Author:
//   berg
var getURL, makeRequest, util, whatsPlaying, wrapInEnvelope, xml2js;

xml2js = require('xml2js');

util = require('util');

wrapInEnvelope = function(body) {
  return `<?xml version="1.0" encoding="utf-8"?>\n<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" s:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/">\n  <s:Body>${body}</s:Body>\n</s:Envelope>`;
};

getURL = function(path) {
  var host;
  host = process.env.HUBOT_SONOS_HOST;
  return `http://${host}:1400${path}`;
};

makeRequest = function(msg, path, action, body, response, cb) {
  var wrappedBody;
  wrappedBody = wrapInEnvelope(body);
  return msg.http(getURL(path)).header('SOAPAction', action).header('Content-type', 'text/xml; charset=utf8').post(wrappedBody)(function(err, resp, body) {
    if (err == null) {
      return (new xml2js.Parser()).parseString(body, function(err, json) {
        var response_body;
        if (err == null) {
          body = json['s:Body'];
          if (body != null) {
            response_body = body[response];
            if (response_body != null) {
              return cb(response_body);
            }
          }
        }
      });
    }
  });
};

whatsPlaying = function(msg) {
  var action, body, path;
  body = "<u:GetPositionInfo xmlns:u=\"urn:schemas-upnp-org:service:AVTransport:1\">\n  <InstanceID>0</InstanceID>\n  <Channel>Master</Channel>\n</u:GetPositionInfo>";
  action = 'urn:schemas-upnp-org:service:AVTransport:1#GetPositionInfo';
  path = '/MediaRenderer/AVTransport/Control';
  return makeRequest(msg, path, action, body, 'u:GetPositionInfoResponse', function(obj) {
    var metadata;
    metadata = obj.TrackMetaData;
    if (metadata != null) {
      return (new xml2js.Parser()).parseString(metadata, function(err, obj) {
        var album, artURI, artist, item, ref, ref1, ref2, reply, title;
        if (err == null) {
          item = obj != null ? obj.item : void 0;
          if (item != null) {
            title = (ref = item['dc:title']) != null ? ref : "(no title)";
            artist = (ref1 = item['dc:creator']) != null ? ref1 : "(no artist)";
            album = (ref2 = item['upnp:album']) != null ? ref2 : "(no album)";
            artURI = item['upnp:albumArtURI'];
            if (artURI != null) {
              artURI = getURL(artURI + "#.png");
            }
            reply = `Now playing: "${title}" by ${artist} (off of "${album}") ${artURI}`;
            return msg.reply(reply);
          }
        }
      });
    }
  });
};

module.exports = function(robot) {
  return robot.respond(/what'?s playing\??/i, function(msg) {
    return whatsPlaying(msg);
  });
};
