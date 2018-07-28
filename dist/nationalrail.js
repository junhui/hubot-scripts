// Description:
//   Get National Rail live departure information

// Dependencies:
//   None

// Configuration:
//   HUBOT_DEFAULT_STATION - set the default from station (nearest to your home/office)

// Commands:
//   hubot: trains <departure station> to <arrival station>
//   hubot: trains <arrival station>
//   hubot: trains <departure station> to  - lists next 5 departures

// Notes:
//   Use the station code (https://en.wikipedia.org/wiki/UK_railway_stations)

// Author:
//  JamieMagee
module.exports = function(robot) {
  return robot.respond(/trains (\w{3})( (to)*(.*))*/i, function(msg) {
    var trainFrom, trainTo;
    trainFrom = !!msg.match[4] ? msg.match[1].toUpperCase() : process.env.HUBOT_DEFAULT_STATION;
    trainTo = !!msg.match[4] ? msg.match[4].toUpperCase() : msg.match[1].toUpperCase();
    return msg.http('http://ojp.nationalrail.co.uk/service/ldb/liveTrainsJson').query({
      departing: 'true',
      liveTrainsFrom: trainFrom,
      liveTrainsTo: trainTo
    }).get()(function(err, res, body) {
      var info, key, ref, results, stuff, value;
      stuff = JSON.parse(body);
      if (stuff.trains.length) {
        msg.reply(`Next trains from: ${trainFrom} to ${trainTo}`);
        ref = stuff.trains;
        results = [];
        for (key in ref) {
          value = ref[key];
          if (key < 5) {
            info = `${value}`.split(",");
            if (!!info[4]) {
              results.push(msg.send(`The ${info[1]} to ${info[2]} at platform ${info[4]} is ${/[^;]*$/.exec(info[3])[0].trim().toLowerCase()}`));
            } else {
              results.push(msg.send(`The ${info[1]} to ${info[2]} is ${/[^;]*$/.exec(info[3])[0].trim().toLowerCase()}`));
            }
          } else {
            results.push(void 0);
          }
        }
        return results;
      } else {
        return msg.send(`I couldn't find trains from: ${trainFrom} to ${trainTo}`);
      }
    });
  });
};
