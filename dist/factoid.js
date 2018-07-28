// Description:
//   javabot style factoid support for your hubot. Build a factoid library
//   and save yourself typing out answers to similar questions

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   ~<factoid> is <some phrase, link, whatever> - Creates a factoid
//   ~<factoid> is also <some phrase, link, whatever> - Updates a factoid.
//   ~<factoid> - Prints the factoid, if it exists. Otherwise tells you there is no factoid
//   ~tell <user> about <factoid> - Tells the user about a factoid, if it exists
//   ~~<user> <factoid> - Same as ~tell, less typing
//   <factoid>? - Same as ~<factoid> except for there is no response if not found
//   hubot no, <factoid> is <some phrase, link, whatever> - Replaces the full definition of a factoid
//   hubot factoids list - List all factoids
//   hubot factoid delete "<factoid>" - delete a factoid

// Author:
//   arthurkalm
var Factoids;

Factoids = class Factoids {
  constructor(robot1) {
    this.robot = robot1;
    this.robot.brain.on('loaded', () => {
      this.cache = this.robot.brain.data.factoids;
      if (!this.cache) {
        return this.cache = {};
      }
    });
  }

  add(key, val) {
    var input;
    input = key;
    if (this.cache[key] == null) {
      key = key.toLowerCase();
    }
    if (this.cache[key]) {
      return `${input} is already ${this.cache[key]}`;
    } else {
      return this.setFactoid(input, val);
    }
  }

  append(key, val) {
    var input;
    input = key;
    if (this.cache[key] == null) {
      key = key.toLowerCase();
    }
    if (this.cache[key]) {
      this.cache[key] = this.cache[key] + ", " + val;
      this.robot.brain.data.factoids = this.cache;
      return `Ok. ${input} is also ${val} `;
    } else {
      return `No factoid for ${input}. It can't also be ${val} if it isn't already something.`;
    }
  }

  setFactoid(key, val) {
    var input;
    input = key;
    if (this.cache[key] == null) {
      key = key.toLowerCase();
    }
    this.cache[key] = val;
    this.robot.brain.data.factoids = this.cache;
    return `OK. ${input} is ${val} `;
  }

  delFactoid(key) {
    var input;
    input = key;
    if (this.cache[key] == null) {
      key = key.toLowerCase();
    }
    delete this.cache[key];
    this.robot.brain.data.factoids = this.cache;
    return `OK. I forgot about ${input}`;
  }

  niceGet(key) {
    var input;
    input = key;
    if (this.cache[key] == null) {
      key = key.toLowerCase();
    }
    return this.cache[key] || `No factoid for ${input}`;
  }

  get(key) {
    if (this.cache[key] == null) {
      key = key.toLowerCase();
    }
    return this.cache[key];
  }

  list() {
    return Object.keys(this.cache);
  }

  tell(person, key) {
    var factoid;
    factoid = this.get(key);
    if (this.cache[key]) {
      return `${person}, ${key} is ${factoid}`;
    } else {
      return factoid;
    }
  }

  handleFactoid(text) {
    var match;
    if (match = /^~(.+?) is also (.+)/i.exec(text)) {
      return this.append(match[1], match[2]);
    } else if (match = /^~(.+?) is (.+)/i.exec(text)) {
      return this.add(match[1], match[2]);
    } else if (match = (/^~tell (.+?) about (.+)/i.exec(text)) || (/^~~(.+) (.+)/.exec(text))) {
      return this.tell(match[1], match[2]);
    } else if (match = /^~(.+)/i.exec(text)) {
      return this.niceGet(match[1]);
    }
  }

};

module.exports = function(robot) {
  var factoids;
  factoids = new Factoids(robot);
  robot.hear(/^~(.+)/i, function(msg) {
    var match;
    if (match = (/^~tell (.+) about (.+)/i.exec(msg.match)) || (/^~~(.+) (.+)/.exec(msg.match))) {
      return msg.send(factoids.handleFactoid(msg.message.text));
    } else {
      return msg.reply(factoids.handleFactoid(msg.message.text));
    }
  });
  robot.hear(/(.+)\?/i, function(msg) {
    var factoid;
    factoid = factoids.get(msg.match[1]);
    if (factoid) {
      return msg.reply(msg.match[1] + " is " + factoid);
    }
  });
  robot.respond(/no, (.+) is (.+)/i, function(msg) {
    return msg.reply(factoids.setFactoid(msg.match[1], msg.match[2]));
  });
  robot.respond(/factoids? list/i, function(msg) {
    return msg.send(factoids.list().join('\n'));
  });
  return robot.respond(/factoids? delete "(.*)"$/i, function(msg) {
    return msg.reply(factoids.delFactoid(msg.match[1]));
  });
};
