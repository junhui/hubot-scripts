// Description
//   Remembers a key and value

// Commands:
//   hubot what is|remember <key> - Returns a string
//   hubot remember <key> is <value>. - Returns nothing. Remembers the text for next time!
//   hubot what do you remember - Returns everything hubot remembers.
//   hubot forget <key> - Removes key from hubots brain.
//   hubot what are your favorite memories? - Returns a list of the most remembered memories.  
//   hubot random memory - Returns a random string

// Dependencies:
//   "underscore": "*"
var _;

_ = require('underscore');

module.exports = function(robot) {
  var findSimilarMemories, memories, memoriesByRecollection;
  memoriesByRecollection = function() {
    var base;
    return (base = robot.brain.data).memoriesByRecollection != null ? base.memoriesByRecollection : base.memoriesByRecollection = {};
  };
  memories = function() {
    var base;
    return (base = robot.brain.data).remember != null ? base.remember : base.remember = {};
  };
  findSimilarMemories = function(key) {
    var searchRegex;
    searchRegex = new RegExp(key, 'i');
    return Object.keys(memories()).filter(function(key) {
      return searchRegex.test(key);
    });
  };
  robot.respond(/(?:what is|rem(?:ember)?)\s+(.*)/i, function(msg) {
    var base, currently, key, keys, match, matchingKeys, searchPattern, value, words;
    words = msg.match[1];
    if (match = words.match(/(.*?)(\s+is\s+([\s\S]*))$/i)) {
      msg.finish();
      key = match[1].toLowerCase();
      value = match[3];
      currently = memories()[key];
      if (currently) {
        return msg.send(`But ${key} is already ${currently}.  Forget ${key} first.`);
      } else {
        memories()[key] = value;
        return msg.send(`OK, I'll remember ${key}.`);
      }
    } else if (match = words.match(/([^?]+)\??/i)) {
      msg.finish();
      key = match[1].toLowerCase();
      value = memories()[key];
      if (value) {
        if ((base = memoriesByRecollection())[key] == null) {
          base[key] = 0;
        }
        memoriesByRecollection()[key]++;
      } else {
        if (match = words.match(/\|\s*(grep\s+)?(.*)$/i)) {
          searchPattern = match[2];
          matchingKeys = findSimilarMemories(searchPattern);
          if (matchingKeys.length > 0) {
            value = `I remember:\n${matchingKeys.join('\n')}`;
          } else {
            value = `I don't remember anything matching \`${searchPattern}\``;
          }
        } else {
          matchingKeys = findSimilarMemories(key);
          if (matchingKeys.length > 0) {
            keys = matchingKeys.join('\n');
            value = `I don't remember \`${key}\`. Did you mean:\n${keys}`;
          } else {
            value = `I don't remember anything matching \`${key}\``;
          }
        }
      }
      return msg.send(value);
    }
  });
  robot.respond(/forget\s+(.*)/i, function(msg) {
    var key, value;
    key = msg.match[1].toLowerCase();
    value = memories()[key];
    delete memories()[key];
    delete memoriesByRecollection()[key];
    return msg.send(`I've forgotten ${key} is ${value}.`);
  });
  robot.respond(/what do you remember/i, function(msg) {
    var key, keys;
    msg.finish();
    keys = [];
    for (key in memories()) {
      keys.push(key);
    }
    return msg.send(`I remember:\n${keys.join('\n')}`);
  });
  robot.respond(/what are your favorite memories/i, function(msg) {
    var sortedMemories;
    msg.finish();
    sortedMemories = _.sortBy(Object.keys(memoriesByRecollection()), function(key) {
      return memoriesByRecollection()[key];
    });
    sortedMemories.reverse();
    return msg.send(`My favorite memories are:\n${sortedMemories.slice(0, 21).join('\n')}`);
  });
  robot.respond(/(me|random memory|memories)$/i, function(msg) {
    var randomKey;
    msg.finish();
    randomKey = msg.random(Object.keys(memories()));
    msg.send(randomKey);
    return msg.send(memories()[randomKey]);
  });
  return robot.respond(/mem(ory)? bomb x?(\d+)/i, function(msg) {
    var count, i, key, keys, ref, ref1, results, value;
    keys = [];
    ref = memories();
    for (key in ref) {
      value = ref[key];
      keys.push(value);
    }
    if (!msg.match[2]) {
      count = 10;
    } else {
      count = parseInt(msg.match[2]);
    }
    results = [];
    for (i = 1, ref1 = count; (1 <= ref1 ? i <= ref1 : i >= ref1); 1 <= ref1 ? i++ : i--) {
      results.push(msg.send(msg.random(keys)));
    }
    return results;
  });
};
