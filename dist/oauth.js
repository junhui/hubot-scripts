// Description:
//   This is a basic OAuth authentication bot which is meant to be used with
//   other scripts to interact and get data via signed API requests. Script
//   has a dependency to scribe-node library that fundamentally wraps OAuth
//   routines to give simpler and maintainable development experience for coders.

// Dependencies:
//   "scribe-node": ">=0.0.24"

// Configuration:
//   None

// Commands:
//   get <api> authorization url - get a link to authorization place
//   set <api> verifier <verification_code> - set verification code and access token after first step
//   set <api> access token <code> - set access token manually, for OAuth 2.0 (Facebook) only
//   refresh <api> token - refresh access token if it expires, for OAuth 2.0 only
//   get <api> request token - retrieves request token public value
//   get <api> access token - retrieves access token public value
//   get <api> verifier - retrieves verification code
//   remove <api> authorization - clears tokens from memory if user is same who verified the last authorization

// Author:
//   mmstud
var handle_authorization, handle_refresh, handle_verification, hear_and_respond, scribe, services;

scribe = require('scribe-node').load(['OAuth']);

// set custom service configurations if not available from scribe OAuth widget.
// see examples and instructions from the loaded module widget itself:
// https://github.com/mmstud/scribe-node/blob/master/src/widgets/OAuth.coffee
services = {};

handle_authorization = function(robot, msg) {
  var callback;
  callback = function(url) {
    var message;
    message = url ? url : "Error on retrieving url. See logs for more details.";
    return msg.send(message);
  };
  return new scribe.OAuth(robot.brain.data, msg.match[1].toLowerCase(), services).get_authorization_url(callback);
};

handle_verification = function(robot, msg) {
  var api, callback;
  api = msg.match[1].toLowerCase();
  callback = function(response) {
    var message;
    if (response) {
      if (!robot.brain.data.oauth_user) {
        robot.brain.data.oauth_user = [];
      }
      // set up owner for authorization. affects only to removing it so far.
      // but note that someone can still overwrite authorization if wanted!
      robot.brain.data.oauth_user[api] = msg.message.user.reply_to;
      message = "Verification done";
    } else {
      message = "Error on verification process. See logs for more details.";
    }
    return msg.send(message);
  };
  return new scribe.OAuth(robot.brain.data, api, services).set_verification_code(msg.match[2], callback);
};

handle_refresh = function(robot, msg) {
  var access_token, callback, service;
  service = new scribe.OAuth(robot.brain.data, msg.match[1].toLowerCase(), services);
  if (access_token = service.get_access_token()) {
    callback = function(response) {
      var message;
      message = response ? "Access token refreshed" : "Error on refreshing access token. See logs for more details.";
      return msg.send(message);
    };
    return service.refresh_access_token(access_token, callback);
  } else {
    return msg.send("Access token not found");
  }
};

// small factory to support both gtalk and other adapters by hearing all lines or those called by bot name only
hear_and_respond = function(robot, regex, callback) {
  robot.hear(eval('/^' + regex + '/i'), callback);
  return robot.respond(eval('/' + regex + '/i'), callback);
};

module.exports = function(robot) {
  hear_and_respond(robot, 'get ([0-9a-zA-Z].*) authorization url$', function(msg) {
    return handle_authorization(robot, msg);
  });
  hear_and_respond(robot, 'set ([0-9a-zA-Z].*) verifier (.*)', function(msg) {
    return handle_verification(robot, msg);
  });
  hear_and_respond(robot, 'refresh ([0-9a-zA-Z].*) token$', function(msg) {
    return handle_refresh(robot, msg);
  });
  hear_and_respond(robot, 'get ([0-9a-zA-Z].*) request token$', function(msg) {
    var message, token;
    if (token = new scribe.OAuth(robot.brain.data, msg.match[1].toLowerCase(), services).get_request_token()) {
      message = "Request token: " + token.getToken();
    } else {
      message = "Request token not found";
    }
    return msg.send(message);
  });
  hear_and_respond(robot, 'get ([0-9a-zA-Z].*) access token$', function(msg) {
    var message, token;
    if (token = new scribe.OAuth(robot.brain.data, msg.match[1].toLowerCase(), services).get_access_token()) {
      message = "Access token: " + token.getToken();
    } else {
      message = "Access token not found";
    }
    return msg.send(message);
  });
  hear_and_respond(robot, 'get ([0-9a-zA-Z].*) verifier$', function(msg) {
    var message, token;
    if (token = new scribe.OAuth(robot.brain.data, msg.match[1].toLowerCase(), services).get_verifier()) {
      message = "Verifier: " + token.getValue();
    } else {
      message = "Verifier not found";
    }
    return msg.send(message);
  });
  hear_and_respond(robot, 'remove ([0-9a-zA-Z].*) authorization$', function(msg) {
    var api, message;
    api = msg.match[1].toLowerCase();
    if (robot.brain.data.oauth_user && robot.brain.data.oauth_user[api] === msg.message.user.reply_to) {
      message = "Authorization removed: " + new scribe.OAuth(robot.brain.data, api, services).remove_authorization();
    } else {
      message = "Authorization can be removed by original verifier only: " + robot.brain.data.oauth_user[api];
    }
    return msg.send(message);
  });
  return hear_and_respond(robot, 'set ([0-9a-zA-Z].*) access token (.*)', function(msg) {
    var api, message;
    api = msg.match[1].toLowerCase();
    if (new scribe.OAuth(robot.brain.data, api, services).set_access_token_code(msg.match[2])) {
      robot.brain.data.oauth_user[api] = msg.message.user.reply_to;
      message = "Access token set";
    } else {
      message = "Error on setting access token";
    }
    return msg.send(message);
  });
};
