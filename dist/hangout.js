// Description:
//  Listens for "hangout" keyword and sends Google Hangout url. Saves a couple minutes in our office.

// Configuration:
//   HUBOT_HANGOUT_URL

// Commands:
//   hubot hangout - sends hangout url

// Notes:
//  To generate a static Hangout URL, create a Google+ event sometime in the future
//  @ https://plus.google.com/events

// Author:
//   nicoritschel
module.exports = function(robot) {
  return robot.respond(/hangout\s.*/i, function(msg) {
    if (process.env.HUBOT_HANGOUT_URL) {
      return msg.send(process.env.HUBOT_HANGOUT_URL);
    } else {
      return msg.send('Environment variable HUBOT_HANGOUT_URL has not been set. Add EXPORT HUBOT_HANGOUT_URL="..." to your Procfile.');
    }
  });
};
