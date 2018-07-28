// Description:
//   None

// Dependencies:
//   "redis": "0.8.4"

// Configuration:
//   REDISTOGO_URL or REDISCLOUD_URL or BOXEN_REDIS_URL or REDIS_URL.
//   URL format: redis://<host>:<port>[/<brain_prefix>]
//   If not provided, '<brain_prefix>' will default to 'hubot'.

// Commands:
//   None

// Authors:
//   atmos
//   jan0sch
//   spajus
var Redis, Url;

Url = require("url");

Redis = require("redis");

module.exports = function(robot) {
  var client, getData, info, prefix, ref;
  info = Url.parse(process.env.REDISTOGO_URL || process.env.REDISCLOUD_URL || process.env.BOXEN_REDIS_URL || process.env.REDIS_URL || 'redis://localhost:6379', true);
  client = Redis.createClient(info.port, info.hostname);
  prefix = ((ref = info.path) != null ? ref.replace('/', '') : void 0) || 'hubot';
  robot.brain.setAutoSave(false);
  getData = function() {
    return client.get(`${prefix}:storage`, function(err, reply) {
      if (err) {
        throw err;
      } else if (reply) {
        robot.logger.info(`Data for ${prefix} brain retrieved from Redis`);
        robot.brain.mergeData(JSON.parse(reply.toString()));
      } else {
        robot.logger.info(`Initializing new data for ${prefix} brain`);
        robot.brain.mergeData({});
      }
      return robot.brain.setAutoSave(true);
    });
  };
  if (info.auth) {
    client.auth(info.auth.split(":")[1], function(err) {
      if (err) {
        return robot.logger.error("Failed to authenticate to Redis");
      } else {
        robot.logger.info("Successfully authenticated to Redis");
        return getData();
      }
    });
  }
  client.on("error", function(err) {
    return robot.logger.error(err);
  });
  client.on("connect", function() {
    robot.logger.debug("Successfully connected to Redis");
    if (!info.auth) {
      return getData();
    }
  });
  robot.brain.on('save', function(data = {}) {
    return client.set(`${prefix}:storage`, JSON.stringify(data));
  });
  return robot.brain.on('close', function() {
    return client.quit();
  });
};
