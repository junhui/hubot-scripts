// Description:
//   Replaces default `redis-brain` with MongoDB one. Useful
//   to those who wants to have persistence on completely free
//   Heroku account.

// Dependencies:
//   "mongodb": "*"

// Configuration:
//   MONGOLAB_URI

// Commands:
//   None

// Author:
//   juancoen, darvin
var MongoClient, decodeKeys, encodeKeys;

MongoClient = require('mongodb').MongoClient;

encodeKeys = function(obj) {
  var key, value;
  if (typeof obj !== 'object') {
    return obj;
  }
  for (key in obj) {
    value = obj[key];
    if (obj.hasOwnProperty(key)) {
      obj[key.replace(/\./g, ":::")] = encodeKeys(obj[key]);
      if (key.indexOf(".") > -1) {
        delete obj[key];
      }
    }
  }
  return obj;
};

decodeKeys = function(obj) {
  var key, value;
  if (typeof obj !== 'object') {
    return obj;
  }
  for (key in obj) {
    value = obj[key];
    if (obj.hasOwnProperty(key)) {
      obj[key.replace(/:::/g, ".")] = encodeKeys(obj[key]);
      if (key.indexOf(":::") > -1) {
        delete obj[key];
      }
    }
  }
  return obj;
};

module.exports = function(robot) {
  var mongoUrl;
  mongoUrl = process.env.MONGOLAB_URI;
  return MongoClient.connect(mongoUrl, function(err, db) {
    if (err != null) {
      throw err;
    } else {
      robot.logger.debug("Successfully connected to Mongo");
      db.createCollection('storage', function(err, collection) {
        return collection.findOne({}, function(err, document) {
          if (err != null) {
            throw err;
          } else if (document) {
            document = decodeKeys(document);
            return robot.brain.mergeData(document);
          }
        });
      });
      robot.brain.on('save', function(data) {
        return db.collection('storage', function(err, collection) {
          var opts;
          // https://github.com/christkv/node-mongodb-native/blob/master/lib/mongodb/collection.js#L373
          // update(selector, document, options, callback)
          data = encodeKeys(data);
          opts = {
            safe: true,
            upsert: true
          };
          return collection.update({}, data, opts, function(err) {
            if (err != null) {
              throw err;
            }
          });
        });
      });
      return robot.brain.on('close', function() {
        return db.close();
      });
    }
  });
};
