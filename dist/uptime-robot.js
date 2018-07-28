// Description:
//   Show uptime status of sites monitored by UptimeRobot.

// Dependencies:
//   None

// Configuration:
//   HUBOT_UPTIMEROBOT_APIKEY

// Commands:
//   hubot uptimerobot - Show the status of the monitored sites
//   hubot what is the uptime of the monitored sites? - Show the status of the monitored sites
//   hubot uptimerobot add <url>[ as <friendlyname>] - Instructs uptime robot to monitor the <url>, optionally with a name
//   hubot start monitoring the http uptime of <url> - Instructs uptime robot to monitor the <url>

// Author:
//   lukesmith
module.exports = function(robot) {
  var apikey, getMonitors, newMonitor;
  apikey = process.env.HUBOT_UPTIMEROBOT_APIKEY;
  getMonitors = function(msg) {
    return msg.http("http://api.uptimerobot.com/getMonitors").query({
      apiKey: apikey,
      logs: 0,
      format: "json",
      noJsonCallback: 1
    }).get()(function(err, res, body) {
      var i, len, monitor, ref, response, results, status;
      if (err) {
        msg.send(`Uptime robot says: ${err}`);
        return;
      }
      response = JSON.parse(body);
      if (response.stat === "ok") {
        ref = response.monitors.monitor;
        results = [];
        for (i = 0, len = ref.length; i < len; i++) {
          monitor = ref[i];
          status = "";
          switch (monitor.status) {
            case "1":
              status = "paused";
              break;
            case "2":
              status = "up";
              break;
            case "8":
              status = "seems down";
              break;
            case "9":
              status = "down";
              break;
            default:
              status = "unknown";
          }
          results.push(msg.send(`${monitor.friendlyname}: has an uptime of ${monitor.alltimeuptimeratio}% and current status of ${status}`));
        }
        return results;
      } else if (response.stat === "fail") {
        return msg.send(`Uhoh, ${response.message}`);
      }
    });
  };
  robot.respond(/what is the uptime of the monitored sites?/i, getMonitors);
  robot.respond(/uptimerobot/i, getMonitors);
  newMonitor = function(monitorUrl, monitorFriendlyName) {
    if (monitorFriendlyName == null) {
      monitorFriendlyName = monitorUrl;
    }
    return msg.http("http://api.uptimerobot.com/newMonitor").query({
      apiKey: apikey,
      monitorFriendlyName: monitorFriendlyName,
      monitorURL: monitorUrl,
      monitorType: 1,
      format: "json",
      noJsonCallback: 1
    }).get()(function(err, res, body) {
      var response;
      response = JSON.parse(body);
      if (response.stat === "ok") {
        msg.send("done");
      }
      if (response.stat === "fail") {
        return msg.send(`${response.message}`);
      }
    });
  };
  robot.respond(/start monitoring the http uptime of (.*)$/i, function(msg) {
    return newMonitor(msg.match[1], null);
  });
  return robot.respond(/uptimerobot add (http(s?)\:\/\/\S+)( as (.+))?/i, function(msg) {
    return newMonitor(msg.match[1], msg.match[4]);
  });
};
