  // Description:
  //   The game of Hangman.
  //   Words and definitions are sourced via the Wordnik API. You'll need an API
  //   key from http://developer.wordnik.com/

  // Dependencies:
  //   None

  // Configuration:
  //   WORDNIK_API_KEY

  // Commands:
  //   hubot hangman - Display the state of the current game
  //   hubot hangman <letterOrWord> - Make a guess

  // Author:
  //   harukizaemon
var Game, defineWord, generateWord, isOrAre, play, pluralisedGuess,
  indexOf = [].indexOf;

Game = class Game {
  constructor(word, definitions1) {
    var letter;
    this.definitions = definitions1;
    this.word = word.toUpperCase();
    this.wordLetters = this.word.split(/ /);
    this.answerLetters = (function() {
      var i, len, ref, results;
      ref = this.wordLetters;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        letter = ref[i];
        results.push("_");
      }
      return results;
    }).call(this);
    this.remainingGuesses = 9;
    this.previousGuesses = [];
    this.message = null;
  }

  isFinished() {
    return this.wasAnswered() || this.wasHung();
  }

  wasAnswered() {
    return indexOf.call(this.answerLetters, "_") < 0;
  }

  wasHung() {
    return this.remainingGuesses === 0;
  }

  guess(guess) {
    if (!guess) {
      this.noGuess();
      return;
    }
    guess = guess.trim().toUpperCase();
    if (indexOf.call(this.previousGuesses, guess) >= 0) {
      return this.duplicateGuess(guess);
    } else {
      this.previousGuesses.push(guess);
      switch (guess.length) {
        case 1:
          return this.guessLetter(guess);
        case this.word.length:
          return this.guessWord(guess);
        default:
          return this.errantWordGuess(guess);
      }
    }
  }

  guessLetter(guess) {
    var i, index, indexes, len, letter;
    indexes = (function() {
      var i, len, ref, results;
      ref = this.wordLetters;
      results = [];
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        letter = ref[index];
        if (guess === letter) {
          results.push(index);
        }
      }
      return results;
    }).call(this);
    if (indexes.length > 0) {
      for (i = 0, len = indexes.length; i < len; i++) {
        index = indexes[i];
        this.answerLetters[index] = this.wordLetters[index];
      }
      return this.correctGuess(`Yes, there ${isOrAre(indexes.length, guess)}`);
    } else {
      return this.incorrectGuess(`Sorry, there are no ${guess}'s`);
    }
  }

  guessWord(guess) {
    if (guess === this.word) {
      this.answerLetters = this.wordLetters;
      return this.correctGuess("Yes, that's correct");
    } else {
      return this.incorrectGuess(`Sorry, the word is not ${guess}`);
    }
  }

  noGuess() {
    return this.message = null;
  }

  errantWordGuess(guess) {
    return this.message = `The word ${guess} isn't the correct length so let's pretend that never happened, shall we?`;
  }

  duplicateGuess(guess) {
    return this.message = `You already tried ${guess} so let's pretend that never happened, shall we?`;
  }

  correctGuess(message) {
    return this.message = message;
  }

  incorrectGuess(message) {
    if (this.remainingGuesses > 0) {
      this.remainingGuesses -= 1;
    }
    return this.message = message;
  }

  eachMessage(callback) {
    if (this.message) {
      callback(this.message);
    }
    if (this.isFinished()) {
      if (this.wasHung()) {
        callback("You have no remaining guesses");
      } else if (this.wasAnswered()) {
        callback(`Congratulations, you still had ${pluralisedGuess(this.remainingGuesses)} remaining!`);
      }
      callback(`The ${this.wordLetters.length} letter word was: ${this.word}`);
      return callback(this.definitions);
    } else {
      callback(`The ${this.answerLetters.length} letter word is: ${this.answerLetters.join(' ')}`);
      return callback(`You have ${pluralisedGuess(this.remainingGuesses)} remaining`);
    }
  }

};

module.exports = function(robot) {
  var gamesByRoom;
  gamesByRoom = {};
  return robot.respond(/hangman( .*)?$/i, function(msg) {
    var room;
    if (process.env.WORDNIK_API_KEY === void 0) {
      msg.send("Missing WORDNIK_API_KEY env variable.");
      return;
    }
    room = msg.message.user.room;
    return play(msg, gamesByRoom[room], function(game) {
      gamesByRoom[room] = game;
      game.guess(msg.match[1]);
      return game.eachMessage(function(message) {
        return msg.send(message);
      });
    });
  });
};

play = function(msg, game, callback) {
  if (!game || game.isFinished()) {
    return generateWord(msg, function(word, definitions) {
      return callback(new Game(word, definitions));
    });
  } else {
    return callback(game);
  }
};

generateWord = function(msg, callback) {
  return msg.http("http://api.wordnik.com/v4/words.json/randomWord").query({
    hasDictionaryDef: true,
    minDictionaryCount: 3,
    minLength: 5
  }).headers({
    api_key: process.env.WORDNIK_API_KEY
  }).get()(function(err, res, body) {
    var result, word;
    result = JSON.parse(body);
    word = result ? result.word : "hangman";
    return defineWord(msg, word, callback);
  });
};

defineWord = function(msg, word, callback) {
  return msg.http(`http://api.wordnik.com/v4/word.json/${escape(word)}/definitions`).header("api_key", process.env.WORDNIK_API_KEY).get()(function(err, res, body) {
    var definitions, lastSpeechType, reply;
    definitions = JSON.parse(body);
    if (definitions.length === 0) {
      return callback(word, "No definitions found.");
    } else {
      reply = "";
      lastSpeechType = null;
      definitions = definitions.forEach(function(def) {
        // Show the part of speech (noun, verb, etc.) when it changes
        if (def.partOfSpeech !== lastSpeechType) {
          if (def.partOfSpeech !== void 0) {
            reply += ` (${def.partOfSpeech})\n`;
          }
        }
        // Track the part of speech
        lastSpeechType = def.partOfSpeech;
        // Add the definition
        return reply += `  - ${def.text}\n`;
      });
      return callback(word, reply);
    }
  });
};

isOrAre = function(count, letter) {
  if (count === 1) {
    return `is one ${letter}`;
  } else {
    return `are ${count} ${letter}'s`;
  }
};

pluralisedGuess = function(count) {
  if (count === 1) {
    return "one guess";
  } else {
    return `${count} guesses`;
  }
};
