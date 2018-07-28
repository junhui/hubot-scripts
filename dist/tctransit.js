// Description:
//   Allows users to check MetroTransit times in the TwinCities
//   metrotransit.herokuapp.com

// Dependencies:
//   none

// Configuration:
//   none

// Commands:
//   hubot when is the next <route #> going <north/south/east/west> from <4 letter stop code OR street name>

// Author:
//   pyro2927
var TransitAPI;

module.exports = function(robot) {
  return robot.respond(/when is the next (.*) going (.*) from (.*)/i, function(msg) {
    var dirNum, direction, route, stop;
    route = msg.match[1];
    direction = msg.match[2];
    dirNum = 4;
    if (direction.toLowerCase() === "east") {
      dirNum = 2;
    } else if (direction.toLowerCase() === "west") {
      dirNum = 3;
    } else if (direction.toLowerCase() === "south") {
      dirNum = 1;
    }
    stop = msg.match[3];
    if (stop.length !== 4) {
      return TransitAPI.search_stop_codes(route, dirNum, stop, msg);
    } else {
      return TransitAPI.fetch_next_stop(route, dirNum, stop, msg);
    }
  });
};

TransitAPI = class TransitAPI {
  constructor() {
    this.fetch_next_stop = this.fetch_next_stop.bind(this);
    this.search_stop_codes = this.search_stop_codes.bind(this);
  }

  fetch_next_stop(route, dirNum, stopCode, msg) {
    return msg.http('http://metrotransit.herokuapp.com/nextTrip?route=' + route + '&direction=' + dirNum + '&stop=' + stopCode).get()((err, res, body) => {
      var stops, time;
      stops = JSON.parse(body);
      if (stops.count <= 0) {
        msg.send("No next stops");
        return;
      }
      time = stops[0].time;
      if (time.match(/Min$/)) {
        time = "in " + time;
      } else if (time.match(/:/)) {
        time = "at " + time;
      }
      return msg.send("The next " + route + " at " + stops[0].stop_name + " is " + time);
    });
  }

  search_stop_codes(route, dirNum, stopName, msg) {
    return msg.http('http://metrotransit.herokuapp.com/stops?route=' + route + '&direction=' + dirNum).get()((err, res, body) => {
      var i, len, stop, stops;
      stops = JSON.parse(body);
      // too bad, no stops found for this
      if (stops.count <= 0) {
        msg.send("No stops available for the " + route + " going that direction");
        return;
      }
// see if any of our stops match
      for (i = 0, len = stops.length; i < len; i++) {
        stop = stops[i];
        if (stop.name.toLowerCase().indexOf(stopName.toLowerCase()) > -1) {
          this.fetch_next_stop(route, dirNum, stop.key, msg);
          return;
        }
      }
      return msg.send("No stops found with name: " + stopName);
    });
  }

};

TransitAPI = new TransitAPI();
