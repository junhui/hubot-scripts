// Description:
//   Play a game of chess!

// Dependencies:
//   "chess": "0.1.3"

// Configuration:
//   None

// Commands:
//   hubot chess me - Creates a new game between yourself and another person in the room
//   hubot chess status - Gets the current state of the board
//   hubot chess move <to> - Moves a piece to the coordinate position using standard chess notation

// Author:
//   thallium205

var Chess, boardToFen;

Chess = require('chess');

module.exports = function(robot) {
  robot.respond(/chess me$/i, function(msg) {
    robot.brain.data.chess[msg.message.room] = Chess.create();
    return boardToFen(robot.brain.data.chess[msg.message.room].getStatus(), function(status, fen) {
      return msg.send('http://webchess.freehostia.com/diag/chessdiag.php?fen=' + encodeURIComponent(fen) + '&size=large&coord=yes&cap=yes&stm=yes&fb=no&theme=classic&format=auto&color1=E3CEAA&color2=635147&color3=000000&.png');
    });
  });
  robot.respond(/chess status/i, function(msg) {
    var e;
    try {
      return boardToFen(robot.brain.data.chess[msg.message.room].getStatus(), function(status, fen) {
        if (status) {
          msg.send(status);
        }
        return msg.send('http://webchess.freehostia.com/diag/chessdiag.php?fen=' + encodeURIComponent(fen) + '&size=large&coord=yes&cap=yes&stm=yes&fb=no&theme=classic&format=auto&color1=E3CEAA&color2=635147&color3=000000&.png');
      });
    } catch (error) {
      e = error;
      return msg.send(e);
    }
  });
  return robot.respond(/chess move (.*)/i, function(msg) {
    var e;
    try {
      robot.brain.data.chess[msg.message.room].move(msg.match[1]);
      return boardToFen(robot.brain.data.chess[msg.message.room].getStatus(), function(status, fen) {
        if (status) {
          msg.send(status);
        }
        return msg.send('http://webchess.freehostia.com/diag/chessdiag.php?fen=' + encodeURIComponent(fen) + '&size=large&coord=yes&cap=yes&stm=yes&fb=no&theme=classic&format=auto&color1=E3CEAA&color2=635147&color3=000000&.png');
      });
    } catch (error) {
      e = error;
      return msg.send(e);
    }
  });
};

boardToFen = function(status, callback) {
  var blank, fen, i, j, lastRank, len, len1, msg, rank, ref, square;
  fen = [[], [], [], [], [], [], [], []];
  blank = 0;
  lastRank = 0;
  ref = status.board.squares;
  for (i = 0, len = ref.length; i < len; i++) {
    square = ref[i];
    if (lastRank !== square.rank) {
      if (blank !== 0) {
        fen[lastRank - 1].push(blank);
        blank = 0;
      }
    }
    if (square.piece === null) {
      blank = blank + 1;
    } else {
      if (square.piece.type === 'pawn') {
        if (blank === 0) {
          fen[square.rank - 1].push(square.piece.side.name === 'white' ? 'P' : 'p');
        } else {
          fen[square.rank - 1].push(blank);
          fen[square.rank - 1].push(square.piece.side.name === 'white' ? 'P' : 'p');
          blank = 0;
        }
      } else {
        if (blank === 0) {
          fen[square.rank - 1].push(square.piece.side.name === 'white' ? square.piece.notation.toUpperCase() : square.piece.notation.toLowerCase());
        } else {
          fen[square.rank - 1].push(blank);
          fen[square.rank - 1].push(square.piece.side.name === 'white' ? square.piece.notation.toUpperCase() : square.piece.notation.toLowerCase());
          blank = 0;
        }
      }
    }
    lastRank = square.rank;
  }
  for (j = 0, len1 = fen.length; j < len1; j++) {
    rank = fen[j];
    rank = rank.join();
  }
  fen = fen.reverse().join('/').replace(/,/g, '');
  msg = '';
  if (status.isCheck) {
    msg += 'Check! ';
  }
  if (status.isCheckmate) {
    msg += 'Checkmate! ';
  }
  if (status.isRepetition) {
    msg += 'Threefold Repetition!  A draw can be called. ';
  }
  if (status.isStalemate) {
    msg += 'Stalemate! ';
  }
  if (Object.keys(status.notatedMoves).length > 0) {
    if (status.notatedMoves[Object.keys(status.notatedMoves)[0]].src.piece.side.name === 'white') {
      fen += ' w';
    } else {
      fen += ' b';
    }
  }
  return callback(msg, fen);
};
