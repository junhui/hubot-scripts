// Description:
//   Displays the current avalanche forecast for norway.

// Dependencies:
//   "jsdom": "0.2.14"
// Configuration:
//   None

// Commands:
//   hubot avy me - Return a breakdown of the avalanche forecast from varsom.no

// Author:
//   Alastair Brunton
var getPlaces, getRiskValues, getScores, joinArs, jsdom;

jsdom = require('jsdom');

getScores = function($, cb) {
  var area_scores, results, tr_length, trs;
  results = [];
  area_scores = {};
  trs = $("tr");
  tr_length = trs.length;
  return trs.each((function(index) {
    return getRiskValues($, $(this), function(err, values) {
      results.push(values);
      if (results.length === tr_length - 1) {
        return cb(null, results);
      } else {

      }
    });
  }));
};

// do nothing
getRiskValues = function($, element, cb) {
  var riskValues;
  riskValues = [];
  return element.children("td.hazard").each(function(index) {
    riskValues.push($(this).text().trim());
    if (riskValues.length === 3) {
      return cb(null, riskValues);
    } else {

    }
  });
};

// do nothing
getPlaces = function($, cb) {
  var locationNames, locations, numLocations;
  locations = $("span.location");
  locationNames = [];
  numLocations = locations.length;
  return locations.each(function(index) {
    return $(this).children().each(function(index2) {
      locationNames.push($(this).text());
      if (locationNames.length === numLocations) {
        return cb(null, locationNames);
      } else {

      }
    });
  });
};

// do nothing
joinArs = function(places, scores) {
  var i, j, joinedAr, len, place, score;
  joinedAr = [];
  i = 0;
  for (j = 0, len = places.length; j < len; j++) {
    place = places[j];
    score = scores[i].join(" ");
    joinedAr.push(`${place} ${score}`);
    i = i + 1;
  }
  return joinedAr.join("\n");
};

module.exports = function(robot) {
  return robot.respond(/avy me/i, function(msg) {
    return jsdom.env("http://varsom.no/Snoskred/", ['http://ajax.googleapis.com/ajax/libs/jquery/1.9.1/jquery.min.js'], function(errors, window) {
      var $;
      $ = window.$;
      return getScores($, function(err, scores) {
        return getPlaces($, function(err, places) {
          var avyReport;
          avyReport = joinArs(places, scores);
          return msg.send(avyReport);
        });
      });
    });
  });
};
