// Description:
//   An interface with the Scalr API's, namely for executing a deploy and a cache flush script

// Dependencies:
//   None

// Configuration:
//   SCALR_API_KEY = Scalr API key
//   SCALR_SECRET_KEY = Scalr secret key
//   SCALR_FARM_NAME = Scalr Farm name
//   SCALR_ROLE_NAME = Scalr role to execute the scripts on
//   SCALR_DEPLOY_SCRIPT = Name of the Deploy script.
//   SCALR_FLUSH_CACHE_SCRIPT = Name of the Cache Flush script.

// Commands:
//   hubot deploy - executes the deploy script, defined via ENV Var "SCALR_DEPLOY_SCRIPT"
//   hubot flush [the ]cache - executes the cache flush script, defined via ENV Var "SCALR_FLUSH_CACHE_SCRIPT"

// Author:
//   twitter.com/linc_sanders
//   github.com/lincsanders
var config_check, run_script, scalr_script_executer, success_message;

success_message = ['The script train has left the station.', 'Script being executed as we speak.', 'The eagle has left the nest.', 'Hold your breath, scripts are running.', 'Victory!'];

scalr_script_executer = "https://execute-scalr-script.eu01.aws.af.cm";

config_check = function() {
  var failure;
  failure = !process.env.SCALR_API_KEY || !process.env.SCALR_SECRET_KEY || !process.env.SCALR_FARM_NAME || !process.env.SCALR_ROLE_NAME || !process.env.SCALR_DEPLOY_SCRIPT || !process.env.SCALR_FLUSH_CACHE_SCRIPT;
  if (failure) {
    msg.send("I don't think you have configured your ENV vars right... Sort it out, man.");
  }
  return failure;
};

run_script = function(script_name, msg) {
  return msg.http(scalr_script_executer).query({
    api_key: process.env.SCALR_API_KEY,
    secret_key: process.env.SCALR_SECRET_KEY,
    farm_name: process.env.SCALR_FARM_NAME,
    role_name: process.env.SCALR_ROLE_NAME,
    script_name: script_name
  }).post()(function(err, res, body) {
    var response;
    response = JSON.parse(body);
    if (response.result) {
      return msg.send(msg.random(success_message));
    } else {
      return msg.send(`I couldn't get a positive response from ${scalr_script_executer}... SOMETHING IS NOT RIGHT ON THAT END.`);
    }
  });
};

module.exports = function(robot) {
  robot.respond(/flush (the |)cache/i, function(msg) {
    if (!config_check) {
      return;
    }
    msg.send("Cache flush initialized...");
    return run_script(process.env.SCALR_FLUSH_CACHE_SCRIPT, msg);
  });
  return robot.respond(/deploy/i, function(msg) {
    if (!config_check) {
      return;
    }
    msg.send("Deploy initialized...");
    return run_script(process.env.SCALR_DEPLOY_SCRIPT, msg);
  });
};
