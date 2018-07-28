// Description:
//   Extends robot adding conversation features

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   None

// Author:
//   pescuma
var Listener;

module.exports = function(robot) {
  robot.eatListeners = {};
  // Public: Adds a Listener that receives the next message from the user and av
  // further processing of it.

  // user     - The user name.
  // callback - A Function that is called with a Response object. msg.match[1] w
  //            contain the message text without the bot name

  // Returns nothing.
  robot.eatOneResponse = function(user, callback) {
    return robot.eatListeners[user.id] = new Listener(robot, callback);
  };
  // Change default receive command, addind processing of eatListeners
  robot.origReceive = robot.receive;
  robot.receive = function(message) {
    var lst;
    if ((message.user != null) && (robot.eatListeners[message.user.id] != null)) {
      lst = robot.eatListeners[message.user.id];
      delete robot.eatListeners[message.user.id];
      if (lst.call(message)) {
        return;
      }
      // Put back to process next message
      robot.eatListeners[message.user.id] = lst;
    }
    return robot.origReceive(message);
  };
  // Public: Waits for the next message from the current user.

  // callback - Called with the user response

  // Returns nothing.
  return robot.Response.prototype.waitResponse = function(callback) {
    return robot.eatOneResponse(this.message.user, callback);
  };
};

Listener = class Listener {
  constructor(robot1, callback1) {
    this.call = this.call.bind(this);
    this.robot = robot1;
    this.callback = callback1;
    if (robot.enableSlash) {
      this.regex = new RegExp(`^(?:\/|${robot.name}:?)\\s*(.*?)\\s*$`, 'i');
    } else {
      this.regex = new RegExp(`^${robot.name}:?\\s*(.*?)\\s*$`, 'i');
    }
    this.matcher = (message) => {
      if (message.text != null) {
        return message.text.match(this.regex);
      }
    };
  }

  call(message) {
    var match;
    if (match = this.matcher(message)) {
      this.callback(new this.robot.Response(this.robot, message, match));
      return true;
    } else {
      return false;
    }
  }

};
