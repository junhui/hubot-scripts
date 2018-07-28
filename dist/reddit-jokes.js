// Description:
//   Random jokes from /r/jokes

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot joke me - Pull a random joke from /r/jokes
//   hubot joke me <list> - Pull a random joke from /r/<list>

// Examples:
//   hubot joke me dad - pulls a random dad joke
//   hubot joke me mom - pulls a random momma joke
//   hubot joke me clean - pulls a random clean joke
//   hubot joke me classy - pulls a random classic joke

// Author:
//   tombell, ericjsilva
module.exports = function(robot) {
  return robot.respond(/joke me(.*)$/i, function(msg) {
    var name, url;
    name = msg.match[1].trim();
    if (name === "dad") {
      url = "dadjokes";
    } else if (name === "clean") {
      url = "cleanjokes";
    } else if (name === "mom") {
      url = "mommajokes";
    } else if (name === "classy") {
      url = "classyjokes";
    } else {
      url = "jokes";
    }
    return msg.http(`http://www.reddit.com/r/${url}.json`).get()(function(err, res, body) {
      var children, data, ex, joke, joketext;
      try {
        data = JSON.parse(body);
        children = data.data.children;
        joke = msg.random(children).data;
        joketext = joke.title.replace(/\*\.\.\.$/, '') + ' ' + joke.selftext.replace(/^\.\.\.\s*/, '');
        return msg.send(joketext.trim());
      } catch (error) {
        ex = error;
        return msg.send(`Erm, something went EXTREMELY wrong - ${ex}`);
      }
    });
  });
};
