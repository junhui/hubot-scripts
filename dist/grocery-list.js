// Description:
//   Organize your grocery list

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot grocery list - list items on your grocery list
//   hubot remind me to buy <item> - add item to grocery list
//   hubot i bought <item> - mark item as purchased
//   hubot remove <item> - remove item from my grocery lists
//   hubot what have i purchased - shows what you've purchased

// Author:
//   parkr
module.exports = function(robot) {
  var groceryList;
  robot.brain.data.groceryList = {
    toBuy: {},
    purchased: {}
  };
  groceryList = {
    get: function() {
      return Object.keys(robot.brain.data.groceryList.toBuy);
    },
    getPurchased: function() {
      return Object.keys(robot.brain.data.groceryList.purchased);
    },
    add: function(item) {
      return robot.brain.data.groceryList.toBuy[item] = true;
    },
    remove: function(item) {
      delete robot.brain.data.groceryList.toBuy[item];
      return true;
    },
    bought: function(item) {
      delete robot.brain.data.groceryList.toBuy[item];
      return robot.brain.data.groceryList.purchased[item] = true;
    }
  };
  robot.respond(/grocery list$/i, function(msg) {
    var list;
    list = groceryList.get().join("\n") || "No items in your grocery list.";
    return msg.send(list);
  });
  robot.respond(/remind me to (buy|get) (.*)/i, function(msg) {
    var item;
    item = msg.match[2].trim();
    groceryList.add(item);
    return msg.send(`ok, added ${item} to your grocery list.`);
  });
  robot.respond(/i bought (.*)/i, function(msg) {
    var item;
    item = msg.match[1].trim();
    groceryList.bought(item);
    return msg.send(`ok, marked ${item} as purchased.`);
  });
  robot.respond(/remove (.*)/i, function(msg) {
    var item;
    item = msg.match[1].trim();
    groceryList.remove(item);
    return msg.send(`ok, removed ${item} from your grocery list.`);
  });
  return robot.respond(/what have i purchased/i, function(msg) {
    var list;
    list = groceryList.getPurchased().join("\n") || "You haven't purchased anything.";
    return msg.send(list);
  });
};
