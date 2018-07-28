// Description:
//   Respond to custom answers

// Dependencies:
//   redis-brain.coffee

// Configuration:
//   None

// Commands:
//   hubot say something about <topic> - will say something he knows about the subject
//   hubot when asked <regexp_of_question> answer <response> - teach your bot to answer to <regexp_of_question> with <response>
//   hubot forget answers - remove every teached answer from bot brain

// Author:
//   NNA
var indexOf = [].indexOf;

module.exports = function(robot) {
  var basic_knowledge, knowledgeAbout, respondToAnswer;
  basic_knowledge = {
    1: {
      regexp: "(what( is|'s))?( your)? favorite( programming)? language",
      answer: 'CoffeeScript'
    },
    2: {
      regexp: 'favorite (os|operating system|platform)',
      answer: 'Linux'
    }
  };
  respondToAnswer = function(item) {
    return robot.respond(new RegExp(item.regexp, 'i'), function(msg) {
      var key, ref;
      ref = robot.brain.data.knowledge;
      for (key in ref) {
        item = ref[key];
        if (msg.match[0].replace(robot.name, '').match(new RegExp(item.regexp, 'i'))) {
          break;
        }
      }
      if ((item != null ? item.answer : void 0) != null) {
        return msg.send(item.answer);
      }
    });
  };
  knowledgeAbout = function(subject) {
    var found, item, key, ref;
    ref = robot.brain.data.knowledge;
    for (key in ref) {
      item = ref[key];
      if (subject.replace(robot.name, '').match(new RegExp(item.regexp, 'i'))) {
        found = true;
        break;
      }
    }
    if (found === true) {
      this.key = key;
      this.item = item;
      return this;
    } else {
      return null;
    }
  };
  robot.brain.on('loaded', () => {
    var base, item, key, ref, results;
    robot.logger.info("Loading knowledge");
    if ((base = robot.brain.data).knowledge == null) {
      base.knowledge = {};
    }
    if (Object.keys(robot.brain.data.knowledge).length === 0) {
      robot.brain.data.knowledge = basic_knowledge;
    }
    ref = robot.brain.data.knowledge;
    results = [];
    for (key in ref) {
      item = ref[key];
      results.push(respondToAnswer(item));
    }
    return results;
  });
  robot.respond(/(when )?asked (.*) (reply|answer|return|say) (.*)$/i, function(msg) {
    var answer, new_question, next_id, question, result;
    question = msg.match[2];
    answer = msg.match[4];
    result = new knowledgeAbout(question);
    if (result.key != null) {
      if (result.item.answer === answer) {
        return msg.send("I already know that");
      } else {
        msg.send(`I thought "${result.item.answer}" but I will now answer "${answer}"`);
        return robot.brain.data.knowledge[result.key].answer = answer;
      }
    } else {
      new_question = {
        regexp: question,
        answer: answer
      };
      next_id = Object.keys(robot.brain.data.knowledge).length + 1;
      robot.brain.data.knowledge[next_id] = new_question;
      respondToAnswer(new_question);
      return msg.send(`OK, I will answer "${answer}" when asked "${question}"`);
    }
  });
  robot.respond(/(forget)( all)? (answers|replies|everything)$/i, function(msg) {
    var i, item, key, ref, ref1;
    ref = robot.brain.data.knowledge;
    for (key in ref) {
      item = ref[key];
      i = 0;
      while (i < robot.listeners.length) {
        if (ref1 = String(item.regexp), indexOf.call(String(robot.listeners[i].regex), ref1) >= 0) {
          robot.listeners.splice(i, 1);
        }
        i++;
      }
    }
    robot.brain.data.knowledge = {};
    return msg.send("OK, I've forgot all answers");
  });
  return robot.respond(/((say )?s(ome)?thing|talk( to me)?)( about (.*))?$/i, function(msg) {
    var answer, knowledge, result, subject;
    subject = msg.match[6];
    knowledge = robot.brain.data.knowledge;
    if (JSON.stringify(knowledge) === '{}') {
      return msg.send("I don't know anything, teach me something please ...");
    } else {
      if (subject === void 0) {
        answer = knowledge[msg.random(Object.keys(knowledge))].answer;
        return msg.send(`I would say ${answer}`);
      } else {
        result = new knowledgeAbout(subject);
        if (result.key != null) {
          return msg.send(`If you ask ${result.item.regexp}, I would answer ${result.item.answer}`);
        } else {
          return msg.send(`I don't know anything about ${subject}, please teach me something about it`);
        }
      }
    }
  });
};
