// Description:
//   Create new cards in Trello

// Dependencies:
//   "node-trello": "latest"

// Configuration:
//   HUBOT_TRELLO_KEY - Trello application key
//   HUBOT_TRELLO_TOKEN - Trello API token
//   HUBOT_TRELLO_LIST - The list ID that you'd like to create cards for

// Commands:
//   hubot trello card <name> - Create a new Trello card
//   hubot trello show - Show cards on list

// Notes:
//   To get your key, go to: https://trello.com/1/appKey/generate
//   To get your token, go to: https://trello.com/1/authorize?key=<<your key>>&name=Hubot+Trello&expiration=never&response_type=token&scope=read,write
//   Figure out what board you want to use, grab it's id from the url (https://trello.com/board/<<board name>>/<<board id>>)
//   To get your list ID, go to: https://trello.com/1/boards/<<board id>>/lists?key=<<your key>>&token=<<your token>>  "id" elements are the list ids.

// Author:
//   carmstrong
var createCard, showCards;

module.exports = function(robot) {
  robot.respond(/trello card (.*)/i, function(msg) {
    var cardName;
    cardName = msg.match[1];
    if (!cardName.length) {
      msg.send("You must give the card a name");
      return;
    }
    if (!process.env.HUBOT_TRELLO_KEY) {
      msg.send("Error: Trello app key is not specified");
    }
    if (!process.env.HUBOT_TRELLO_TOKEN) {
      msg.send("Error: Trello token is not specified");
    }
    if (!process.env.HUBOT_TRELLO_LIST) {
      msg.send("Error: Trello list ID is not specified");
    }
    if (!(process.env.HUBOT_TRELLO_KEY && process.env.HUBOT_TRELLO_TOKEN && process.env.HUBOT_TRELLO_LIST)) {
      return;
    }
    return createCard(msg, cardName);
  });
  return robot.respond(/trello show/i, function(msg) {
    return showCards(msg);
  });
};

createCard = function(msg, cardName) {
  var Trello, t;
  Trello = require("node-trello");
  t = new Trello(process.env.HUBOT_TRELLO_KEY, process.env.HUBOT_TRELLO_TOKEN);
  return t.post("/1/cards", {
    name: cardName,
    idList: process.env.HUBOT_TRELLO_LIST
  }, function(err, data) {
    if (err) {
      msg.send("There was an error creating the card");
      return;
    }
    return msg.send(data.url);
  });
};

showCards = function(msg) {
  var Trello, t;
  Trello = require("node-trello");
  t = new Trello(process.env.HUBOT_TRELLO_KEY, process.env.HUBOT_TRELLO_TOKEN);
  return t.get("/1/lists/" + process.env.HUBOT_TRELLO_LIST, {
    cards: "open"
  }, function(err, data) {
    var card, i, len, ref, results;
    if (err) {
      msg.send("There was an error showing the list.");
      return;
    }
    msg.send("Cards in " + data.name + ":");
    ref = data.cards;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      card = ref[i];
      results.push(msg.send("- " + card.name));
    }
    return results;
  });
};
