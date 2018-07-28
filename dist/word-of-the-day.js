// Description:
//   Return the word of the day.

// Dependencies:
//   "xml2js": "0.1.14"

// Configuration:
//   WOTD_PROVIDER - to 'wordnik' or 'dictionary'
//   WORDNIK_API_KEY - API key from http://developer.wordnik.com/ or http://developer.dictionary.com/

// Commands:
//   hubot wotd (me) (short) - Returns the word of the day.
//   hubot word of the day (me) (short) - Returns the word of the day.

// Notes:
//   FIXME This should be merged with wordnik.coffee

// Author:
//   tapichu

// FIXME use JSON, to avoid a dependency
var Parser, lookup_error, wotd_dictionary, wotd_wordnik;

Parser = require("xml2js").Parser;

module.exports = function(robot) {
  return robot.respond(/(word of the day|wotd)\s?(me)?\s?(short)?(.*)$/i, function(msg) {
    // FIXME prefix WOTD_PROVIDER and DICTIONARY_API_KEY with HUBOT_ for consistency
    if (process.env.WOTD_PROVIDER === "wordnik" && (process.env.WORDNIK_API_KEY != null)) {
      return wotd_wordnik(msg, msg.match[3] != null);
    } else if (process.env.WOTD_PROVIDER === "dictionary" && (process.env.DICTIONARY_API_KEY != null)) {
      return wotd_dictionary(msg, msg.match[3] != null);
    } else {
      return msg.send("Missing WOTD_PROVIDER, WORDNIK_API_KEY or DICTIONARY_API_KEY env variable");
    }
  });
};

wotd_wordnik = function(msg, short_response) {
  return msg.http("http://api.wordnik.com/v4/words.json/wordOfTheDay").header("api_key", process.env.WORDNIK_API_KEY).get()(function(err, res, body) {
    var def, example, i, j, len, len1, ref, ref1, wotd;
    if (err != null) {
      return lookup_error(msg, err);
    } else {
      wotd = JSON.parse(body);
      if (wotd.word != null) {
        msg.send(`Word of the day: ${wotd.word}`);
      }
      if (wotd.definitions != null) {
        ref = wotd.definitions;
        for (i = 0, len = ref.length; i < len; i++) {
          def = ref[i];
          msg.send(`Definition: ${def.text}`);
        }
      }
      if (!short_response) {
        if (wotd.examples != null) {
          ref1 = wotd.examples;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            example = ref1[j];
            msg.send(`Example: ${example.text}`);
          }
        }
        if (wotd.note != null) {
          return msg.send(`Note: ${wotd.note}`);
        }
      }
    }
  });
};

wotd_dictionary = function(msg, short_response) {
  return msg.http("http://api-pub.dictionary.com/v001").query({
    vid: process.env.DICTIONARY_API_KEY,
    type: "wotd"
  }).get()(function(err, res, body) {
    var parser;
    if (err != null) {
      return lookup_error(msg, err);
    } else {
      parser = new Parser;
      return parser.parseString(body, function(error, doc) {
        var def, example, i, j, len, len1, ref, ref1, wotd;
        wotd = doc.entry;
        msg.send(`Word of the day: ${wotd.word}`);
        msg.send(`Pronunciation: ${wotd.pronunciation}`);
        msg.send(`Audio: ${wotd.audio["@"].audioUrl}`);
        if (short_response) {
          return msg.send(`Definition: (${wotd.partofspeech}) ${wotd.shortdefinition}`);
        } else {
          ref = wotd.definitions.definition;
          for (i = 0, len = ref.length; i < len; i++) {
            def = ref[i];
            msg.send(`Definition: (${def.partofspeech}) ${def.data}`);
          }
          ref1 = wotd.examples.example;
          for (j = 0, len1 = ref1.length; j < len1; j++) {
            example = ref1[j];
            msg.send(`Example: ${example.quote}`);
          }
          return msg.send(`Note: ${wotd.footernotes}`);
        }
      });
    }
  });
};

lookup_error = function(msg, err) {
  console.log(err);
  return msg.reply("Sorry, there was an error looking up the word of the day");
};
