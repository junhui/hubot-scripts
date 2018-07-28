// Description:
//   Decides where you should go

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot remember <location> as a <group> location - Remembers the location for the group
//   hubot forget <location> as a <group> location - Forgets the location from the group
//   hubot forget all locations for <group> - Forgets all the locations for the group
//   hubot where can we go for <group>? - Returns a list of places that exist for the group
//   hubot where should we go for <group>? - Returns a randomly selected location for the group

// Author:
//   lukesmith
var Locations;

Locations = class Locations {
  constructor(robot1) {
    this.robot = robot1;
    this.robot.brain.data.locations = {};
  }

  add(groupname, name) {
    var i, len, location, ref;
    if (this.robot.brain.data.locations[groupname] === void 0) {
      this.robot.brain.data.locations[groupname] = [];
    }
    ref = this.robot.brain.data.locations[groupname];
    for (i = 0, len = ref.length; i < len; i++) {
      location = ref[i];
      if (location.toLowerCase() === name.toLowerCase()) {
        return;
      }
    }
    return this.robot.brain.data.locations[groupname].push(name);
  }

  remove(groupname, name) {
    var group, location;
    group = this.robot.brain.data.locations[groupname] || [];
    return this.robot.brain.data.locations[groupname] = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = group.length; i < len; i++) {
        location = group[i];
        if (location.toLowerCase() !== name.toLowerCase()) {
          results.push(location);
        }
      }
      return results;
    })();
  }

  removeAll(groupname) {
    return delete this.robot.brain.data.locations[groupname];
  }

  group(name) {
    return this.robot.brain.data.locations[name] || [];
  }

};

module.exports = function(robot) {
  var locations;
  locations = new Locations(robot);
  robot.respond(/(remember|add) (.*) as a (.*) location/i, function(msg) {
    var locationgroup, locationname;
    locationname = msg.match[2];
    locationgroup = msg.match[3];
    locations.add(locationgroup, locationname);
    if (locationname.toLowerCase() === "nandos") {
      return msg.send("Nom peri peri. My fav.");
    }
  });
  robot.respond(/forget (.*) as a (.*) location/i, function(msg) {
    var locationgroup, locationname;
    locationname = msg.match[1];
    locationgroup = msg.match[2];
    locations.remove(locationgroup, locationname);
    return msg.send(`I've forgotten ${locationname} from ${locationgroup}`);
  });
  robot.respond(/forget all locations for (.*)/i, function(msg) {
    var locationgroup;
    locationgroup = msg.match[1];
    locations.removeAll(locationgroup);
    return msg.send(`I've forgotten all locations from ${locationgroup}`);
  });
  robot.respond(/where can we go for (.*)\?$/i, function(msg) {
    var grouplocations, i, len, location, locationgroup, results;
    locationgroup = msg.match[1];
    grouplocations = locations.group(locationgroup);
    if (grouplocations.length > 0) {
      results = [];
      for (i = 0, len = grouplocations.length; i < len; i++) {
        location = grouplocations[i];
        results.push(msg.send(location));
      }
      return results;
    } else {
      return msg.send(`I don't know anywhere to go for ${locationgroup}`);
    }
  });
  return robot.respond(/where (should|shall) we go for (.*)\?$/i, function(msg) {
    var grouplocations, location, locationgroup;
    locationgroup = msg.match[2];
    grouplocations = locations.group(locationgroup);
    if (grouplocations.length === 0) {
      return msg.send(`I dont know anywhere to go for ${locationgroup}`);
    } else {
      location = msg.random(grouplocations);
      return msg.send(`I think you should go to ${location}`);
    }
  });
};
