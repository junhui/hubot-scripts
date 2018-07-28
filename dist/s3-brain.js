// Description:
//   Stores the brain in Amazon S3

// Dependencies:
//   "aws2js": "0.7.10"

// Configuration:
//   HUBOT_S3_BRAIN_ACCESS_KEY_ID      - AWS Access Key ID with S3 permissions
//   HUBOT_S3_BRAIN_SECRET_ACCESS_KEY  - AWS Secret Access Key for ID
//   HUBOT_S3_BRAIN_BUCKET             - Bucket to store brain in
//   HUBOT_S3_BRAIN_SAVE_INTERVAL      - [Optional] auto-save interval in seconds
//                                     Defaults to 30 minutes

// Commands:

// Notes:
//   Take care if using this brain storage with other brain storages.  Others may
//   set the auto-save interval to an undesireable value.  Since S3 requests have
//   an associated monetary value, this script uses a 30 minute auto-save timer
//   by default to reduce cost.

//   It's highly recommended to use an IAM account explicitly for this purpose
//   https://console.aws.amazon.com/iam/home?
//   A sample S3 policy for a bucket named Hubot-Bucket would be
//   {
//      "Statement": [
//        {
//          "Action": [
//            "s3:DeleteObject",
//            "s3:DeleteObjectVersion",
//            "s3:GetObject",
//            "s3:GetObjectAcl",
//            "s3:GetObjectVersion",
//            "s3:GetObjectVersionAcl",
//            "s3:PutObject",
//            "s3:PutObjectAcl",
//            "s3:PutObjectVersionAcl"
//          ],
//          "Effect": "Allow",
//          "Resource": [
//            "arn:aws:s3:::Hubot-Bucket/brain-dump.json"
//          ]
//        }
//      ]
//    }

// Author:
//   Iristyle
var aws, util;

util = require('util');

aws = require('aws2js');

module.exports = function(robot) {
  var brain_dump_path, bucket, key, loaded, s3, save_interval, secret, store_brain, store_current_brain;
  loaded = false;
  key = process.env.HUBOT_S3_BRAIN_ACCESS_KEY_ID;
  secret = process.env.HUBOT_S3_BRAIN_SECRET_ACCESS_KEY;
  bucket = process.env.HUBOT_S3_BRAIN_BUCKET;
  // default to 30 minutes (in seconds)
  save_interval = process.env.HUBOT_S3_BRAIN_SAVE_INTERVAL || 30 * 60;
  brain_dump_path = `${bucket}/brain-dump.json`;
  if (!key && !secret && !bucket) {
    throw new Error('S3 brain requires HUBOT_S3_BRAIN_ACCESS_KEY_ID, ' + 'HUBOT_S3_BRAIN_SECRET_ACCESS_KEY and HUBOT_S3_BRAIN_BUCKET configured');
  }
  save_interval = parseInt(save_interval);
  if (isNaN(save_interval)) {
    throw new Error('HUBOT_S3_BRAIN_SAVE_INTERVAL must be an integer');
  }
  s3 = aws.load('s3', key, secret);
  store_brain = function(brain_data, callback) {
    var buffer, headers;
    if (!loaded) {
      robot.logger.debug('Not saving to S3, because not loaded yet');
      return;
    }
    buffer = new Buffer(JSON.stringify(brain_data));
    headers = {
      'Content-Type': 'application/json'
    };
    return s3.putBuffer(brain_dump_path, buffer, 'private', headers, function(err, response) {
      if (err) {
        robot.logger.error(util.inspect(err));
      } else if (response) {
        robot.logger.debug(`Saved brain to S3 path ${brain_dump_path}`);
      }
      if (callback) {
        return callback(err, response);
      }
    });
  };
  store_current_brain = function() {
    return store_brain(robot.brain.data);
  };
  s3.get(brain_dump_path, 'buffer', function(err, response) {
    var save_handler;
    // unfortunately S3 gives us a 403 if we have access denied OR
    // the file is simply missing, so no way of knowing if IAM policy is bad
    save_handler = function(e, r) {
      if (e) {
        throw new Error(`Error contacting S3:\n${util.inspect(e)}`);
      }
    };
    // try to store an empty placeholder to see if IAM settings are valid
    if (err) {
      store_brain({}, save_handler);
    }
    if (response && response.buffer) {
      return robot.brain.mergeData(JSON.parse(response.buffer.toString()));
    } else {
      return robot.brain.mergeData({});
    }
  });
  robot.brain.on('loaded', function() {
    loaded = true;
    robot.brain.resetSaveInterval(save_interval);
    return store_current_brain();
  });
  robot.brain.on('save', function() {
    return store_current_brain();
  });
  return robot.brain.on('close', function() {
    return store_current_brain();
  });
};
