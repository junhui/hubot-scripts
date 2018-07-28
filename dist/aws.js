// Description:
//   Queries for the status of AWS services

// Dependencies:
//   "aws2js": "0.6.12"
//   "underscore": "1.3.3"
//   "moment": "1.6.2"

// Configuration:
//   HUBOT_AWS_ACCESS_KEY_ID
//   HUBOT_AWS_SECRET_ACCESS_KEY
//   HUBOT_AWS_SQS_REGIONS
//   HUBOT_AWS_EC2_REGIONS

// Commands:
//   hubot sqs status - Returns the status of SQS queues
//   hubot ec2 status - Returns the status of EC2 instances

// Notes:
//   It's highly recommended to use a read-only IAM account for this purpose
//   https://console.aws.amazon.com/iam/home?
//   SQS - requires ListQueues, GetQueueAttributes and ReceiveMessage
//   EC2 - requires EC2:Describe*, elasticloadbalancing:Describe*, cloudwatch:ListMetrics, 
//   cloudwatch:GetMetricStatistics, cloudwatch:Describe*, autoscaling:Describe*

// Author:
//   Iristyle
var _, aws, defaultRegions, ec2, getRegionInstances, getRegionQueues, key, moment, secret, sqs;

key = process.env.HUBOT_AWS_ACCESS_KEY_ID;

secret = process.env.HUBOT_AWS_SECRET_ACCESS_KEY;

_ = require('underscore');

moment = require('moment');

aws = require('aws2js');

sqs = aws.load('sqs', key, secret).setApiVersion('2011-10-01');

ec2 = aws.load('ec2', key, secret).setApiVersion('2012-05-01');

getRegionInstances = function(region, msg) {
  return ec2.setRegion(region).request('DescribeInstances', function(error, reservations) {
    if (error != null) {
      msg.send(`Failed to describe instances for region ${region} - error ${error}`);
      return;
    }
    return ec2.setRegion(region).request('DescribeInstanceStatus', function(error, allStatuses) {
      var i, instance, instances, len, ref, ref1, results, statuses;
      statuses = error != null ? [] : allStatuses.instanceStatusSet.item;
      instances = _.flatten([(ref = reservations != null ? (ref1 = reservations.reservationSet) != null ? ref1.item : void 0 : void 0) != null ? ref : []]);
      instances = _.pluck(instances, 'instancesSet');
      instances = _.flatten(_.pluck(instances, 'item'));
      msg.send(`Found ${instances.length} instances for region ${region}...`);
      results = [];
      for (i = 0, len = instances.length; i < len; i++) {
        instance = instances[i];
        results.push((function(instance) {
          var arch, bad, badStrings, concat, desc, devType, dexcl, dnsName, excl, iEvents, id, launchTime, name, prefix, ref2, ref3, ref4, ref5, ref6, ref7, ref8, state, status, suffix, tags, type;
          status = _.find(statuses, function(s) {
            return instance.instanceId === s.instanceId;
          });
          suffix = '';
          state = instance.instanceState.name;
          excl = String.fromCharCode(0x203C);
          dexcl = excl + excl;
          switch (state) {
            case 'pending':
              prefix = String.fromCharCode(0x25B2);
              break;
            case 'running':
              prefix = String.fromCharCode(0x25BA);
              break;
            case 'shutting-down':
              prefix = String.fromCharCode(0x25BC);
              break;
            case 'terminated':
              prefix = String.fromCharCode(0x25AA);
              break;
            case 'stopping':
              prefix = String.fromCharCode(0x25A1);
              break;
            case 'stopped':
              prefix = String.fromCharCode(0x25A0);
              break;
            default:
              prefix = dexcl;
          }
          if (status != null) {
            bad = _.filter([status.systemStatus, status.instanceStatus], function(s) {
              return s.status !== 'ok';
            });
            if (bad.length > 0) {
              prefix = dexcl;
              badStrings = _.map(bad, function(b) {
                return b.details.item.name + ' ' + b.details.item.status;
              });
              concat = function(memo, s) {
                return memo + s;
              };
              suffix = _.reduce(badStrings, concat, '');
            }
            iEvents = _.flatten([(ref2 = (ref3 = status.eventsSet) != null ? ref3.item : void 0) != null ? ref2 : []]);
            if (!_.isEmpty(iEvents)) {
              prefix = dexcl;
            }
            desc = function(memo, e) {
              return `${memo} ${dexcl}${e.code} : ${e.description}`;
            };
            suffix += _.reduce(iEvents, desc, '');
          }
          id = (ref4 = instance.instanceId) != null ? ref4 : 'N/A';
          type = instance.instanceType;
          dnsName = _.isEmpty(instance.dnsName) ? 'N/A' : instance.dnsName;
          launchTime = moment(instance.launchTime).format('ddd, L LT');
          arch = instance.architecture;
          devType = instance.rootDeviceType;
          tags = _.flatten([(ref5 = (ref6 = instance.tagSet) != null ? ref6.item : void 0) != null ? ref5 : []]);
          name = (ref7 = (ref8 = _.find(tags, function(t) {
            return t.key === 'Name';
          })) != null ? ref8.value : void 0) != null ? ref7 : 'missing';
          return msg.send(`${prefix} [${state}] - ${name} / ${type} [${devType} ${arch}] / ${dnsName} / ${region} / ${id} - started ${launchTime} ${suffix}`);
        })(instance));
      }
      return results;
    });
  });
};

getRegionQueues = function(region, msg) {
  return sqs.setRegion(region).request('ListQueues', {}, function(error, queues) {
    var ref, ref1, urls;
    if (error != null) {
      msg.send(`Failed to list queues for region ${region} - error ${error}`);
      return;
    }
    urls = _.flatten([(ref = (ref1 = queues.ListQueuesResult) != null ? ref1.QueueUrl : void 0) != null ? ref : []]);
    msg.send(`Found ${urls.length} queues for region ${region}...`);
    return urls.forEach(function(url) {
      var name, path, queue;
      url = url['#'];
      name = url.split('/');
      name = name[name.length - 1];
      path = url.replace(`https://sqs.${region}.amazonaws.com`, '');
      queue = {
        Version: '2011-10-01',
        AttributeName: ['All']
      };
      return sqs.setRegion(region).setQueue(path + '/').request('GetQueueAttributes', queue, function(error, attributes) {
        var attr, inFlight, index, info, msgCount;
        if (error != null) {
          msg.send(`Can't read queue attributes [${name}] (path ${path})` + ` - ${url} - ${error}`);
          return;
        }
        info = attributes.GetQueueAttributesResult.Attribute;
        for (index in info) {
          attr = info[index];
          switch (attr.Name) {
            case 'ApproximateNumberOfMessages':
              msgCount = attr.Value;
              break;
            case 'ApproximateNumberOfMessagesNotVisible':
              inFlight = attr.Value;
          }
        }
        queue.MaxNumberOfMessages = 1;
        queue.VisibilityTimeout = 0;
        return sqs.setRegion(region).setQueue(path + '/').request('ReceiveMessage', queue, function(error, result) {
          var att, queueDesc, sqsmsg, timestamp;
          queueDesc = `[SQS: ${name}] - [${msgCount}] total msgs` + ` / [${inFlight}] in flight`;
          if (error != null) {
            timestamp = `unavailable - ${error}`;
          } else {
            sqsmsg = result.ReceiveMessageResult.Message;
            if ((sqsmsg != null) && (sqsmsg.Attribute != null)) {
              timestamp = (function() {
                var i, len, ref2, results;
                ref2 = sqsmsg.Attribute;
                results = [];
                for (i = 0, len = ref2.length; i < len; i++) {
                  att = ref2[i];
                  if (att.Name === 'SentTimestamp') {
                    results.push(att);
                  }
                }
                return results;
              })();
              timestamp = (moment(parseFloat(timestamp[0].Value))).format('ddd, L LT');
            } else {
              timestamp = 'none available';
            }
          }
          return msg.send(`${queueDesc} / oldest msg ~[${timestamp}] / ${url}`);
        });
      });
    });
  });
};

defaultRegions = 'us-east-1,us-west-1,us-west-2,eu-west-1,ap-southeast-1,ap-northeast-1,sa-east-1';

module.exports = function(robot) {
  robot.respond(/(^|\W)sqs status(\z|\W|$)/i, function(msg) {
    var i, len, ref, ref1, ref2, region, regions, results;
    regions = (ref = (ref1 = process.env) != null ? ref1.HUBOT_AWS_SQS_REGIONS : void 0) != null ? ref : defaultRegions;
    ref2 = regions.split(',');
    results = [];
    for (i = 0, len = ref2.length; i < len; i++) {
      region = ref2[i];
      results.push(getRegionQueues(region, msg));
    }
    return results;
  });
  return robot.respond(/(^|\W)ec2 status(\z|\W|$)/i, function(msg) {
    var i, len, ref, ref1, ref2, region, regions, results;
    regions = (ref = (ref1 = process.env) != null ? ref1.HUBOT_AWS_EC2_REGIONS : void 0) != null ? ref : defaultRegions;
    ref2 = regions.split(',');
    results = [];
    for (i = 0, len = ref2.length; i < len; i++) {
      region = ref2[i];
      results.push(getRegionInstances(region, msg));
    }
    return results;
  });
};
