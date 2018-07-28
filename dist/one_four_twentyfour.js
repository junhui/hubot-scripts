// Description:
//   A drunkly coded, ASCII version of the famous game.
//   Sort of assumes Campfire
//   Game mechanics are easy: http://bruteforcex.blogspot.com/2008/03/1-4-24-dice-game.html

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   dice start - starts a game of one, four, twenty four
//   dice take <dice letters> - takes dice at given levels
//   dice stats - displays your statistics
//   dice stats all - displays all players' statistics

// Authors:
//   zbowling
//   sukima
var BuddhaGame, BuddhaLounge, dieMap;

dieMap = ['A', 'B', 'C', 'D', 'E', 'F'];

BuddhaGame = class BuddhaGame {
  constructor() {
    this.diceLeft = 6;
    this.diceTaken = [];
    this.lastDice = [];
    this.steps = 0;
  }

  toJSON() {
    return {
      diceLeft: this.diceLeft,
      diceTaken: this.diceTaken,
      lastDice: this.lastDice,
      steps: this.steps
    };
  }

  static build(data) {
    var buddha, id, value;
    buddha = new BuddhaGame;
    for (id in data) {
      value = data[id];
      buddha[id] = value;
    }
    return buddha;
  }

  rollRemainingDice() {
    var die, dieIdx, dielines, diestr, i, j, l, printlines, ref, ref1;
    this.lastDice = [];
    printlines = ['', '', '', '', '', '', ''];
    for (dieIdx = j = 0, ref = this.diceLeft; (0 <= ref ? j < ref : j > ref); dieIdx = 0 <= ref ? ++j : --j) {
      die = this.randomDice();
      diestr = this.diceString(die, dieMap[dieIdx], die);
      dielines = diestr.split("\n");
      for (i = l = 0, ref1 = printlines.length; (0 <= ref1 ? l < ref1 : l > ref1); i = 0 <= ref1 ? ++l : --l) {
        printlines[i] += dielines[i];
      }
      this.lastDice.push(die);
    }
    return printlines;
  }

  roll() {
    return "new game!\n" + this.rollRemainingDice().join("\n");
  }

  take(diceToTake) {
    var die, dieIndex, dieLetter, dieLetters, die_val, i, j, l, lastDiceLeftCount, len, m, printlines, ref, ref1, return_str, takenString;
    dieLetters = diceToTake.toUpperCase().replace(" ", "").split("");
    lastDiceLeftCount = this.diceLeft;
    for (j = 0, len = dieLetters.length; j < len; j++) {
      dieLetter = dieLetters[j];
      dieIndex = dieMap.indexOf(dieLetter);
      if (dieIndex !== -1 && dieIndex < this.lastDice.length) {
        die_val = this.lastDice[dieIndex];
        if (die_val !== -1) {
          this.diceTaken.push(die_val);
          this.lastDice[dieIndex] = -1; //marking it invalid so you can pick it twice
          this.diceLeft -= 1;
        }
      }
    }
    if (this.diceLeft === lastDiceLeftCount) {
      return "(you didn't pick any dice.)";
    }
    this.steps += 1;
    printlines = ['', '', '', '', '', '', ''];
    if (this.diceLeft > 1) {
      printlines = this.rollRemainingDice();
      for (i = l = 0, ref = printlines.length; (0 <= ref ? l < ref : l > ref); i = 0 <= ref ? ++l : --l) {
        printlines[i] += "\t  > ";
      }
    } else if (this.diceLeft === 1) { //only one left so lets just end the suffering
      die = this.randomDice();
      this.diceTaken.push(die);
      this.diceLeft = 0;
    }
    takenString = this.diceTakenStringArray();
    for (i = m = 0, ref1 = printlines.length; (0 <= ref1 ? m < ref1 : m > ref1); i = 0 <= ref1 ? ++m : --m) {
      printlines[i] += takenString[i];
    }
    return_str = printlines.join("\n") + "\n" + this.calculateScoreString();
    if (this.diceLeft <= 0) {
      return_str += "\nNice job!";
    }
    return return_str;
  }

  scoreValue() {
    var dice_val, dieIdx, has_four, has_one, j, ref, score;
    score = 0;
    has_one = false;
    has_four = false;
    for (dieIdx = j = 0, ref = this.diceTaken.length; (0 <= ref ? j < ref : j > ref); dieIdx = 0 <= ref ? ++j : --j) {
      dice_val = this.diceTaken[dieIdx];
      if (dice_val === 4 && has_four === false) {
        has_four = true;
      } else if (dice_val === 1 && has_one === false) {
        has_one = true;
      } else {
        score += dice_val;
      }
    }
    if (this.diceLeft <= 0 && (has_one === false || has_four === false)) {
      score = 0;
    }
    return {
      score: score,
      taken: this.diceTaken,
      hasOne: has_one,
      hasFour: has_four,
      steps: this.steps
    };
  }

  calculateScoreString() {
    var dice_val, dieIdx, has_four, has_one, j, ref, score;
    score = 0;
    has_one = false;
    has_four = false;
    for (dieIdx = j = 0, ref = this.diceTaken.length; (0 <= ref ? j < ref : j > ref); dieIdx = 0 <= ref ? ++j : --j) {
      dice_val = this.diceTaken[dieIdx];
      if (dice_val === 4 && has_four === false) {
        has_four = true;
      } else if (dice_val === 1 && has_one === false) {
        has_one = true;
      } else {
        score += dice_val;
      }
    }
    if (this.diceLeft <= 0 && (has_one === false || has_four === false)) {
      return "score: 0 // bummer...";
    } else if (has_one === false && has_four === false) {
      return `score: ${score} (you still need to take a 1 and a 4)`;
    } else if (has_one === false && has_four === true) {
      return `score: ${score} (you still need to take a 1)`;
    } else if (has_four === false && has_one === true) {
      return `score: ${score} (you still need to take a 4)`;
    } else {
      return `score: ${score}`;
    }
  }

  diceTakenStringArray() {
    var dice_score, dice_val, dieIdx, dielines, diestr, has_four, has_one, i, j, l, printlines, ref, ref1;
    printlines = ['', '', '', '', '', '', ''];
    has_one = false;
    has_four = false;
    for (dieIdx = j = 0, ref = this.diceTaken.length; (0 <= ref ? j < ref : j > ref); dieIdx = 0 <= ref ? ++j : --j) {
      dice_val = this.diceTaken[dieIdx];
      dice_score = "-";
      if (dice_val === 4 && has_four === false) {
        has_four = true;
      } else if (dice_val === 1 && has_one === false) {
        has_one = true;
      } else {
        dice_score = dice_val;
      }
      diestr = this.diceString(dice_val, "*", dice_score);
      dielines = diestr.split("\n");
      for (i = l = 0, ref1 = printlines.length; (0 <= ref1 ? l < ref1 : l > ref1); i = 0 <= ref1 ? ++l : --l) {
        printlines[i] += dielines[i];
      }
    }
    return printlines;
  }

  gameover() {
    if (this.diceLeft <= 0) {
      return true;
    } else {
      return false;
    }
  }

  randomDice() {
    return 1 + Math.floor(Math.random() * 6);
  }

  diceString(value, i, x) {
    switch (value) {
      case 1:
        return `${x}     \n --------- \n |       | \n |   o   | \n |       | \n --------- \n ${i}     \n`;
      case 2:
        return `${x}     \n --------- \n | o     | \n |       | \n |     o | \n --------- \n ${i}     \n`;
      case 3:
        return `${x}     \n --------- \n | o     | \n |   o   | \n |     o | \n --------- \n ${i}     \n`;
      case 4:
        return `${x}     \n --------- \n | o   o | \n |       | \n | o   o | \n --------- \n ${i}     \n`;
      case 5:
        return `${x}     \n --------- \n | o   o | \n |   o   | \n | o   o | \n --------- \n ${i}     \n`;
      case 6:
        return `${x}     \n --------- \n | o   o | \n | o   o | \n | o   o | \n --------- \n ${i}     \n`;
    }
  }

};

BuddhaLounge = class BuddhaLounge {
  constructor(robot1) {
    this.robot = robot1;
    this.games = {};
    this.playerdata = {};
    this.players = {};
    this.robot.brain.on('loaded', () => {
      var game_data, id, ref;
      if (this.robot.brain.data.buddhagames != null) {
        ref = this.robot.brain.data.buddhagames;
        for (id in ref) {
          game_data = ref[id];
          this.games[id] = BuddhaGame.build(game_data);
        }
      }
      if (this.robot.brain.data.playerdata != null) {
        return this.playerdata = this.robot.brain.data.playerdata;
      }
    });
  }

  startGame(msg, player) {
    var game;
    game = new BuddhaGame;
    msg.reply("\n" + game.roll());
    this.games[player.id] = game;
    if (this.players[player.id] == null) {
      this.players[player.id] = player;
    }
    if (this.playerdata[player.id] == null) {
      this.playerdata[player.id] = {
        totalScore: 0,
        totalGamesStarted: 0,
        totalGamesFinished: 0,
        lastScore: 0
      };
    }
    this.playerdata[player.id].totalGamesStarted += 1;
    return this.save();
  }

  take(msg, player, take) {
    var game, scoreValue;
    if (this.games[player.id] != null) {
      game = this.games[player.id];
      msg.reply("\n" + game.take(take));
      scoreValue = game.scoreValue();
      if (scoreValue.taken.length === 4 && !(scoreValue.hasOne && scoreValue.hasFour)) {
        msg.play("drama");
      }
      if (game.gameover()) {
        if (scoreValue.score === 24) {
          if (scoreValue.taken.steps === 1) {
            msg.play("yeah");
          } else {
            msg.play("pushit");
          }
        } else if (scoreValue.taken.steps === 1 && scoreValue.hasOne && scoreValue.hasFour) {
          msg.play("live");
        } else if (scoreValue.score >= 22) {
          msg.play("tada");
        } else if (scoreValue.score >= 18) {
          msg.play("greatjob");
        } else if (scoreValue.score > 0) {
          msg.play("crickets");
        } else {
          msg.play("trombone");
        }
        this.playerdata[player.id].lastScore = scoreValue.score;
        this.playerdata[player.id].totalScore = scoreValue.score + this.playerdata[player.id].totalScore;
        this.playerdata[player.id].totalGamesFinished = this.playerdata[player.id].totalGamesFinished + 1;
        delete this.games[player.id];
      }
    } else {
      msg.reply("you aren't playing a game.");
    }
    return this.save();
  }

  playerstats(player) {
    var average, data;
    data = this.playerdata[player.id];
    if (data == null) {
      return "You have not played a game yet.";
    }
    average = data.totalGamesFinished > 0 ? data.totalScore / data.totalGamesFinished : 0;
    return `\n\tlast score: ${data.lastScore}\n\taverage score: ${average}\n\ttotal games finished: ${data.totalGamesFinished}\n\ttotal games started: ${data.totalGamesStarted}`;
  }

  save() {
    this.robot.brain.data.buddhagames = this.games;
    return this.robot.brain.data.playerdata = this.playerdata;
  }

  stats(msg) {
    var k, player, ref, return_str, v;
    return_str = "";
    ref = this.players;
    for (k in ref) {
      v = ref[k];
      player = k;
      return_str += this.playerstats(v);
    }
    return msg.reply(return_str);
  }

  reset(msg, player) {
    delete this.playerdata[player.id];
    msg.reply("Your stats have been reset.");
    return this.save();
  }

};

module.exports = function(robot) {
  var buddha;
  buddha = new BuddhaLounge(robot);
  robot.hear(/buddha start|dice start|bdstart/i, function(msg) {
    return buddha.startGame(msg, msg.message.user);
  });
  robot.hear(/buddha stats|dice stats/i, function(msg) {
    return msg.reply(buddha.playerstats(msg.message.user));
  });
  robot.hear(/buddha stats all|dice stats all|bdstat/i, function(msg) {
    return buddha.stats(msg);
  });
  robot.hear(/buddha reset|dice reset/i, function(msg) {
    return buddha.reset(msg, msg.message.user);
  });
  return robot.hear(/(buddha take|dice take|bdt) ([\w .-]+)/i, function(msg) {
    return buddha.take(msg, msg.message.user, msg.match[2]);
  });
};
