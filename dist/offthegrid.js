// Description:
//  Search what food trucks are at which offthegrid location for the current day.

// Dependencies:
//   None

// Configuration:
//   FACEBOOK_ACCESS_TOKEN

// Commands:
//   hubot offthegrid

// Author:
//   aoiwelle
var ROW_STRING, TruckEvent, otg_id, x;

otg_id = '129511477069092';

ROW_STRING = '\n' + ((function() {
  var i, results;
  results = [];
  for (x = i = 1; i <= 40; x = ++i) {
    results.push('=');
  }
  return results;
})()).join('') + '\n';

TruckEvent = (function() {
  class TruckEvent {
    constructor(eventListing, msg, callback) {
      var url;
      this.name = eventListing.name;
      this.start = new Date(eventListing.start_time);
      this.id = eventListing.id;
      url = `https://graph.facebook.com/${this.id}`;
      msg.http(url).query({
        access_token: process.env.FACEBOOK_ACCESS_TOKEN
      }).get()((err, res, body) => {
        var descr;
        if (!err) {
          descr = JSON.parse(body).description;
        }
        this.description = descr;
        return callback();
      });
    }

  };

  TruckEvent.prototype.start = TruckEvent.start;

  TruckEvent.prototype.description = TruckEvent.description;

  return TruckEvent;

}).call(this);

module.exports = function(robot) {
  return robot.respond(/offthegrid/i, function(msg) {
    var d;
    d = new Date();
    return msg.http(`https://graph.facebook.com/${otg_id}/events`).query({
      access_token: process.env.FACEBOOK_ACCESS_TOKEN
    }).get()(function(err, res, body) {
      var callback, event, event_data, graph_data, i, len, outstandingCallbacks, ref, results;
      if (err) {
        return msg.send(`Sorry, Facebook or OTG don't like you. ERROR:${err}`);
      }
      if (res.statusCode !== 200) {
        return msg.send(`Unable to get list of events: ${res.statusCode + ':\n' + body}`);
      }
      graph_data = JSON.parse(body);
      outstandingCallbacks = 0;
      this.testme = {};
      callback = function() {
        var descriptionString, item, items;
        outstandingCallbacks -= 1;
        if (outstandingCallbacks === 0) {
          items = testme[d.toDateString()];
          descriptionString = (function() {
            var i, len, results;
            results = [];
            for (i = 0, len = items.length; i < len; i++) {
              item = items[i];
              results.push(item.description.replace(/^\s*/g, ''));
            }
            return results;
          })();
          descriptionString = descriptionString.join('\n' + ROW_STRING + '\n');
          return msg.send(`Today:\n${descriptionString}`);
        }
      };
      ref = graph_data.data;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        event_data = ref[i];
        outstandingCallbacks += 1;
        event = new TruckEvent(event_data, msg, callback);
        if (!testme[event.start.toDateString()]) {
          testme[event.start.toDateString()] = [];
        }
        results.push(testme[event.start.toDateString()].push(event));
      }
      return results;
    });
  });
};
