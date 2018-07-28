// Description:
//   None

// Dependencies:
//   "xml2js": "0.1.14"

// Configuration:
//   None

// Commands:
//   hubot tvshow me <show> - Show info about <show>

// Author:
//   victorbutler
var xml2js;

xml2js = require("xml2js");

module.exports = function(robot) {
  return robot.respond(/tvshow(?: me)? (.*)/i, function(msg) {
    var query;
    query = encodeURIComponent(msg.match[1]);
    return msg.http(`http://services.tvrage.com/feeds/full_search.php?show=${query}`).get()(function(err, res, body) {
      var parser;
      if (res.statusCode === 200 && (err == null)) {
        parser = new xml2js.Parser();
        return parser.parseString(body, function(err, result) {
          var response, show;
          if (result.Results && ((result = result.Results).show != null)) {
            if (result.show.length != null) {
              show = result.show[0];
            } else {
              show = result.show;
            }
            if (show.status === "Canceled/Ended") {
              response = `${show.name} aired for ${show.seasons} season`;
              if (show.seasons > 1) {
                response += "s";
              }
              response += ` from ${show.started} till ${show.ended}`;
              if ((show.network != null) && show.network['#']) {
                response += ` on ${show.network['#']}`;
              }
              response += ` ${show.link}`;
              return msg.reply(response);
            } else {
              // get more info
              return msg.http(`http://services.tvrage.com/feeds/episode_list.php?sid=${show.showid}`).get()(function(err, res, details) {
                if (res.statusCode === 200 && (err == null)) {
                  parser = new xml2js.Parser();
                  return parser.parseString(details, function(err, showdetails) {
                    var ecb, i, len, now, ref, season, unaired;
                    showdetails = showdetails.Show;
                    now = new Date();
                    ecb = function(season_arr) {
                      var edate, episode, i, len, ref;
                      ref = season_arr.episode;
                      for (i = 0, len = ref.length; i < len; i++) {
                        episode = ref[i];
                        edate = new Date();
                        edate.setTime(Date.parse(episode.airdate + ' ' + show.airtime));
                        if (edate.getTime() > now.getTime()) {
                          episode.season = season_arr.$.no;
                          return episode;
                        }
                      }
                    };
                    if (showdetails.Episodelist[0].Season.length != null) {
                      ref = showdetails.Episodelist[0].Season;
                      for (i = 0, len = ref.length; i < len; i++) {
                        season = ref[i];
                        unaired = ecb(season);
                      }
                    } else {
                      unaired = ecb(showdetails.Episodelist[0].Season);
                    }
                    if (unaired) {
                      response = `${show.name} is a ${show.status} which started airing ${show.started}. The next show, titled "${unaired.title}" (S${unaired.season}E${unaired.seasonnum}) is scheduled for ${unaired.airdate}`;
                      if (show.day != null) {
                        response += ` ${show.day}`;
                      }
                      if (show.airtime != null) {
                        response += ` at ${show.airtime}`;
                      }
                      if ((show.network != null) && show.network['#']) {
                        response += ` on ${show.network['#']}`;
                      }
                      response += ` ${unaired.link}`;
                      return msg.reply(response);
                    } else {
                      response = `${show.name} is a ${show.status} with ${show.seasons} (or more) season`;
                      if (show.seasons > 1) {
                        response += "s";
                      }
                      response += ` beginning ${show.started}`;
                      if (show.airtime != null) {
                        response += ` at ${show.airtime}`;
                      }
                      if ((show.network != null) && show.network['#']) {
                        response += ` on ${show.network['#']}`;
                      }
                      response += ` ${show.link}`;
                      return msg.reply(response);
                    }
                  });
                } else {
                  return msg.reply("Sorry, there was an error looking up your show");
                }
              });
            }
          } else {
            return msg.reply("I couldn't find TV show " + msg.match[1]);
          }
        });
      } else {
        return msg.reply("Sorry, there was an error looking up your show");
      }
    });
  });
};
