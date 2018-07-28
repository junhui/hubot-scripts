// Description:
//   Base36 encoding and decoding

// Dependencies:
//   "big-integer": "1.1.5"

// Configuration:
//   None

// Commands:
//   hubot base36 e(ncode)|d(ecode) <query> - Base36 encode or decode <query>

// Author:
//   plytro
var Base36, Base36Builder;

module.exports = function(robot) {
  robot.hear(/base36 e(ncode)?( me)? (.*)/i, function(msg) {
    var e;
    try {
      return msg.send(Base36.encode(msg.match[3]));
    } catch (error) {
      e = error;
      if (e.message !== 'Value passed is not an integer.') {
        throw e;
      }
      return msg.send("Base36 encoding only works with Integer values.");
    }
  });
  return robot.hear(/base36 d(ecode)?( me)? (.*)/i, function(msg) {
    var e;
    try {
      return msg.send(String(Base36.decode(msg.match[3])));
    } catch (error) {
      e = error;
      if (e.message !== 'Value passed is not a valid Base36 string.') {
        throw e;
      }
      return msg.send("Not a valid base36 encoded string.");
    }
  });
};

Base36Builder = (function() {
  var bigInt;

  class Base36Builder {
    constructor() {
      this.alphabet = "0123456789abcdefghijklmnopqrstuvwxyz";
      this.base = this.alphabet.length;
    }

    encode(strIn) {
      var mod, num, str;
      num = bigInt(strIn);
      str = "";
      while (num.greaterOrEquals(this.base)) {
        mod = bigInt(num.mod(this.base));
        str = this.alphabet[mod.toString()] + str;
        num = num.subtract(mod).divide(this.base);
      }
      return str = this.alphabet[num.toString()] + str;
    }

    decode(str) {
      var char, char_index, i, index, len, num, power, ref;
      num = bigInt("0");
      power = bigInt(this.base);
      ref = str.split("").reverse();
      for (index = i = 0, len = ref.length; i < len; index = ++i) {
        char = ref[index];
        if ((char_index = this.alphabet.indexOf(char)) === -1) {
          throw new Error('Value passed is not a valid Base36 string.');
        }
        num = num.plus(power.pow(index).multiply(char_index));
      }
      return num.toString();
    }

  };

  bigInt = require("big-integer");

  return Base36Builder;

}).call(this);

Base36 = new Base36Builder();
