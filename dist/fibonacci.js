// Description:
//   Calculate the nth fibonacci number. #webscale

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   fibonacci me <integer> - Calculate Nth Fibonacci number

// Author:
//   ckdake
var divmodBasic, fibFast, fib_bits;

fib_bits = function(n) {
  var bit, bits;
  // Represent an integer as an array of binary digits.
  bits = [];
  while (n > 0) {
    [n, bit] = divmodBasic(n, 2);
    bits.push(bit);
  }
  return bits.reverse();
};

fibFast = function(n) {
  var a, b, bit, c, i, len, ref;
  [a, b, c] = [1, 0, 1];
  ref = fib_bits(n);
  for (i = 0, len = ref.length; i < len; i++) {
    bit = ref[i];
    if (bit) {
      [a, b] = [(a + c) * b, b * b + c * c];
    } else {
      [a, b] = [a * a + b * b, (a + c) * b];
    }
    c = a + b;
  }
  return b;
};

divmodBasic = function(x, y) {
  var q, r;
  return [(q = Math.floor(x / y)), (r = x < y ? x : x % y)];
};

module.exports = function(robot) {
  return robot.hear(/fibonacci me (\d+)/i, function(msg) {
    return msg.send(fibFast(msg.match[1]).toString());
  });
};
