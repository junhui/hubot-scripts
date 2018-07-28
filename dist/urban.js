// Description:
//   Define terms via Urban Dictionary

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot what is <term>?         - Searches Urban Dictionary and returns definition
//   hubot urban me <term>         - Searches Urban Dictionary and returns definition
//   hubot urban define me <term>  - Searches Urban Dictionary and returns definition
//   hubot urban example me <term> - Searches Urban Dictionary and returns example 

// Author:
//   Travis Jeffery (@travisjeffery)
//   Robbie Trencheny (@Robbie)

// Contributors:
//   Benjamin Eidelman (@beneidel)
var urbanDict;

module.exports = function(robot) {
  robot.respond(/what ?is ([^\?]*)[\?]*/i, function(msg) {
    return urbanDict(msg, msg.match[1], function(found, entry, sounds) {
      if (!found) {
        msg.send(`I don't know what "${msg.match[1]}" is`);
        return;
      }
      msg.send(`${entry.definition}`);
      if (sounds && sounds.length) {
        return msg.send(`${sounds.join(' ')}`);
      }
    });
  });
  return robot.respond(/(urban)( define)?( example)?( me)? (.*)/i, function(msg) {
    return urbanDict(msg, msg.match[5], function(found, entry, sounds) {
      if (!found) {
        msg.send(`"${msg.match[5]}" not found`);
        return;
      }
      if (msg.match[3]) {
        msg.send(`${entry.example}`);
      } else {
        msg.send(`${entry.definition}`);
      }
      if (sounds && sounds.length) {
        return msg.send(`${sounds.join(' ')}`);
      }
    });
  });
};

urbanDict = function(msg, query, callback) {
  return msg.http(`http://api.urbandictionary.com/v0/define?term=${escape(query)}`).get()(function(err, res, body) {
    var result;
    result = JSON.parse(body);
    if (result.list.length) {
      return callback(true, result.list[0], result.sounds);
    } else {
      return callback(false);
    }
  });
};
