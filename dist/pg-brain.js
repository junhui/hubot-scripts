// Description:
//   Stores the brain in Postgres

// Dependencies:
//   "pg": "~0.10.2"

// Configuration:
//   DATABASE_URL

// Commands:
//   None

// Notes:
//   Run the following SQL to setup the table and column for storage.

//   CREATE TABLE hubot (
//     id CHARACTER VARYING(1024) NOT NULL,
//     storage TEXT,
//     CONSTRAINT hubot_pkey PRIMARY KEY (id)
//   )
//   INSERT INTO hubot VALUES(1, NULL)

// Author:
//   danthompson
var Postgres;

Postgres = require('pg');

// sets up hooks to persist the brain into postgres.
module.exports = function(robot) {
  var client, database_url, query;
  database_url = process.env.DATABASE_URL;
  if (database_url == null) {
    throw new Error('pg-brain requires a DATABASE_URL to be set.');
  }
  client = new Postgres.Client(database_url);
  client.connect();
  robot.logger.debug(`pg-brain connected to ${database_url}.`);
  query = client.query("SELECT storage FROM hubot LIMIT 1");
  query.on('row', function(row) {
    if (row['storage'] != null) {
      robot.brain.mergeData(JSON.parse(row['storage'].toString()));
      return robot.logger.debug("pg-brain loaded.");
    }
  });
  client.on("error", function(err) {
    return robot.logger.error(err);
  });
  robot.brain.on('save', function(data) {
    query = client.query("UPDATE hubot SET storage = $1", [JSON.stringify(data)]);
    return robot.logger.debug("pg-brain saved.");
  });
  return robot.brain.on('close', function() {
    return client.end();
  });
};
