// Description:
//   Returns the weather from thefuckingweather.com

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot what's the weather for <city> - Get the weather for a location
//   hubot what's the weather for <zip> - Get the weather for a zipcode

// Author:
//   aaronott
var weather;

weather = function(msg, query, cb) {
  return msg.http('http://thefuckingweather.com/').query({
    where: query
  }).header('User-Agent', 'Mozilla/5.0').get()(function(err, res, body) {
    var flavor, ref, ref1, ref2, remark, temp;
    temp = ((ref = body.match(/<span class="temperature" tempf="\d*">(\d+)/)) != null ? ref[1] : void 0) || "";
    remark = ((ref1 = body.match(/<p class="remark">(.*)</)) != null ? ref1[1] : void 0) || "remark not found";
    flavor = ((ref2 = body.match(/<p class="flavor">(.*)</)) != null ? ref2[1] : void 0) || "flavor not found";
    return cb(temp, remark, flavor);
  });
};

module.exports = function(robot) {
  return robot.respond(/(what's|what is) the weather for (.*)/i, function(msg) {
    return weather(msg, msg.match[2], function(temp, remark, flavor) {
      var out;
      out = temp + " degrees " + remark + " " + flavor;
      return msg.send(out);
    });
  });
};
