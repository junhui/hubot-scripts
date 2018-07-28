// Description:
//   allows hubot to track the cash and burn rate and displays a summary
//   of the current cash state. Also stores historical values in the
//   hubot brain so that they can be referred to later.

//   The s3-brain is HIGHLY recommended for keeping track of historical
//   cash values and not losing everything when hubot restarts.

// Dependencies:
//   None

// Configuration:
//   HUBOT_CASH_CURRENCY_SYMBOL - the currency symbol for displaying money. Default: $
//   HUBOT_CASH_THOUSANDS_SEPARATOR - the symbol used for splitting thousands. Default: ,

// Commands:
//   hubot cash <left|on hand>: <amount> - set the cash on hand
//   hubot cash <burn rate|burn>: <amount> - set the burn rate
//   hubot cash <update|state|stats> - show the cash situation

// Notes:

// Author:
//   jhubert
var Cash, OutputFormatter;

OutputFormatter = (function() {
  class OutputFormatter {
    constructor() {
      return;
    }

    toDollars(number, currency_symbol = process.env.HUBOT_CASH_CURRENCY_SYMBOL || '$', thousands_separator = process.env.HUBOT_CASH_THOUSANDS_SEPARATOR || ',') {
      var i, j, n, sign, x, y;
      n = parseInt(number, 10);
      sign = n < 0 ? "-" : "";
      i = parseInt(n = Math.abs(n).toFixed(0)) + '';
      j = (j = i.length) > 3 ? j % 3 : 0;
      x = j ? i.substr(0, j) + thousands_separator : '';
      y = i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thousands_separator);
      return sign + currency_symbol + x + y;
    }

    toNiceDate(date) {
      date = new Date(String(date));
      return this.months[date.getMonth()] + ' ' + date.getDate() + ', ' + date.getFullYear();
    }

    getMonthName(date) {
      date = new Date(String(date));
      return this.months[date.getMonth()];
    }

  };

  OutputFormatter.prototype.months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return OutputFormatter;

}).call(this);

Cash = class Cash {
  constructor(robot1) {
    this.robot = robot1;
    this.cache = {
      on_hand: [],
      burn_rate: []
    };
    this.robot.brain.on('loaded', () => {
      if (this.robot.brain.data.cash) {
        return this.cache = this.robot.brain.data.cash;
      }
    });
    return;
  }

  clean_number(n) {
    if (typeof n === 'number') {
      return n;
    }
    return parseInt(n.replace(/[^\d]/g, ''), 10);
  }

  set_on_hand(amount) {
    amount = this.clean_number(amount);
    this.cache.on_hand.push({
      date: new Date(),
      amount: amount
    });
    this.robot.brain.data.cash = this.cache;
    return amount;
  }

  set_burn_rate(amount) {
    amount = this.clean_number(amount);
    this.cache.burn_rate.push({
      date: new Date(),
      rate: amount
    });
    this.robot.brain.data.cash = this.cache;
    return amount;
  }

  data() {
    return this.cache;
  }

};

module.exports = function(robot) {
  var cash, optf;
  cash = new Cash(robot);
  optf = new OutputFormatter();
  robot.respond(/cash (left|on hand):? (.+)$/i, function(msg) {
    var amount;
    amount = cash.set_on_hand(msg.match[2]);
    return msg.send(`Ok, cash on hand is ${optf.toDollars(amount)}`);
  });
  robot.respond(/cash burn( rate)?:? (.+)$/i, function(msg) {
    var amount;
    amount = cash.set_burn_rate(msg.match[2]);
    return msg.send(`Ok, our burn rate is ${optf.toDollars(amount)} per month`);
  });
  return robot.respond(/cash (stats|state|update)/i, function(msg) {
    var current_burn, current_cash, data, diff, diff_type, end_date, last_cash, months, output;
    data = cash.data();
    if (data.on_hand.length > 0) {
      current_cash = data.on_hand[data.on_hand.length - 1];
      current_burn = data.burn_rate[data.burn_rate.length - 1];
      if (!current_burn) {
        current_burn = {
          rate: 1,
          date: new Date()
        };
      }
      // Calculate how many months left. Use floor to be conservative
      months = Math.floor(current_cash.amount / current_burn.rate);
      // Get the month that we would run out of money at this rate
      end_date = new Date();
      end_date.setMonth(end_date.getMonth() + months);
      output = '';
      output += `Ok, we have ${optf.toDollars(current_cash.amount)} on hand as of ${optf.toNiceDate(current_cash.date)}`;
      // If we have history, add a comparison to the last cash status
      if (data.on_hand.length > 1) {
        last_cash = data.on_hand[data.on_hand.length - 2];
        diff = current_cash.amount - last_cash.amount;
        if (diff > 0) {
          diff_type = 'more';
        } else {
          diff_type = 'less';
        }
        output += `, which is ${optf.toDollars(Math.abs(diff))} ${diff_type} than on ${optf.toNiceDate(last_cash.date)}. `;
      } else {
        output += ".";
      }
      output += `\nAt our current burn rate (${optf.toDollars(current_burn.rate)} / month), we have ${months} months left. That gets us to ${optf.getMonthName(end_date)} ${end_date.getFullYear()}.`;
      return msg.send(output);
    } else {
      return msg.send("There is no cash information available");
    }
  });
};
