// Description:
//   Playing with Drush integration. Simple implementation of informational drush commands, and a base
//   interface for further drush command integration.

// Dependencies:
//   None

// Configuration:
//   The hubot user will need permissions to run drush on the server that it is installed on.
//   If the site aliases are to remote servers (likely the case) then the hubot user will also need
//   ssh keys setup in order to access these sites.

// Notes:
//   It would have been easier and more elegant to simply allow the user to funnel drush commands directly
//   to the spawn method; however, being that is a colossal security risk, I opted to limit the commands that
//   can be executed as well as the options provided to those commands. By default this is limited to
//   relatively harmless "info" commands.

// Commands:
//   hubot drush sa - show the list of available sites ( --update-aliases will refresh this list )
//   hubot drush rq - show pending core requirements at a warning level or above
//   hubot drush <site alias> cc - Clears "all" cache for a given site alias.
//   hubot drush <site alias> pml - Lists the site modules ( "enabled" and "non-core" by default this can be changed with --disbaled or --core )
//   hubot drush <site alias> pmi <module/theme> - Show detailed info about a module or theme
//   hubot drush <site alias> uinf <user> - Display information about the user specified by uid, email, or username
//   hubot drush <site alias> ws - Show the 10 most recent watchdog messages
//   hubot drush <site alias> vget <variable name> - Show the value of a given variable

// Author:
//   rh0
var drush, drush_interface, spawn;

spawn = require("child_process").spawn;

drush_interface = function() {
  var allowed_commands, execute_drush, parse_command, site_aliases, update_aliases, verify_alias;
  site_aliases = [];
  // helper method to propagate the site aliases in memory
  update_aliases = function(msg) {
    var fetch_aliases, output, raw_aliases;
    output = '';
    raw_aliases = '';
    fetch_aliases = spawn("drush", ["sa"]);
    fetch_aliases.stdout.on("data", function(data) {
      return raw_aliases += data;
    });
    fetch_aliases.stderr.on("data", function(data) {
      return output = "Update experienced an error: " + data;
    });
    return fetch_aliases.on("exit", function(code) {
      if (code === 0) {
        site_aliases = raw_aliases.split('\n');
        output = "Alias update complete.";
      }
      if (msg !== undefined) {
        return msg.send(output);
      }
    });
  };
  // run the update script
  update_aliases();
  // generalized spawn method
  execute_drush = function(msg, drush_args) {
    var drush_spawn, output;
    output = '';
    msg.send("This may take a moment...");
    drush_spawn = spawn("drush", drush_args);
    drush_spawn.stdout.on("data", function(data) {
      return output += data;
    });
    drush_spawn.stderr.on("data", function(data) {
      return output += data;
    });
    return drush_spawn.on("exit", function(code) {
      output += "Command complete.";
      return msg.send(output);
    });
  };
  // the commands that we are allowing drush to execute
  // NOTE: If you decide to augment the commands here please carefully consider what you are opening to the people
  //       interacting with hubot.
  allowed_commands = {
    drush_sa: function(msg, command) {
      if (command.args.indexOf('--update-aliases') === -1) {
        msg.send("If this list is empty or has unexpected results update aliases ('drush sa --update-aliases').");
        return msg.send("Aliases we have in memory:\n" + site_aliases.join("\n"));
      } else {
        msg.send("Updating aliases...");
        return update_aliases(msg);
      }
    },
    drush_cc: function(msg, command) {
      return execute_drush(msg, [command.alias, "cc", "all"]);
    },
    drush_rq: function(msg, command) {
      return execute_drush(msg, [command.alias, "rq", "--severity=1"]);
    },
    drush_pml: function(msg, command) {
      var allowed_options, filtered_options;
      allowed_options = ["--status=enabled", "--status=disabled", "--no-core", "--core"];
      filtered_options = command.args.filter(function(elem) {
        return allowed_options.indexOf(elem) !== -1;
      });
      filtered_options.unshift(command.alias, "pml");
      return execute_drush(msg, filtered_options);
    },
    drush_uinf: function(msg, command) {
      var user_search;
      user_search = command.args.shift();
      return execute_drush(msg, [command.alias, "uinf", user_search]);
    },
    drush_pmi: function(msg, command) {
      var extension_search;
      extension_search = command.args.shift();
      return execute_drush(msg, [command.alias, "pmi", extension_search]);
    },
    drush_ws: function(msg, command) {
      var allowed_options, filtered_options;
      allowed_options = ["--full"];
      filtered_options = command.args.filter(function(elem) {
        return allowed_options.indexOf(elem) !== -1;
      });
      filtered_options.unshift(command.alias, "ws");
      return execute_drush(msg, filtered_options);
    },
    drush_vget: function(msg, command) {
      var variable_search;
      variable_search = command.args.shift();
      // forcing this to --exact to prevent channel flood from a huge search
      return execute_drush(msg, [command.alias, "vget", variable_search, "--exact"]);
    }
  };
  // verify alias before firing the command, saves us time on waiting for an err from drush
  verify_alias = function(check_alias) {
    if (site_aliases.indexOf(check_alias) === -1) {
      return false;
    } else {
      return true;
    }
  };
  // parsing the user input after "drush "
  parse_command = function(user_command) {
    var command, command_suff, extra_args, site_alias;
    extra_args = user_command.split(' ');
    site_alias = extra_args.shift();
    command_suff = '';
    if (site_alias.charAt(0) === "@") {
      if (verify_alias(site_alias.slice(1)) !== false) {
        command_suff = extra_args.shift();
      } else {
        undefined;
      }
    // Kind of gross but the site-alias command is the only one that does not need a site alias
    // so let's check before we fire up drush to fail.
    } else if (site_alias !== "sa") {
      undefined;
    } else {
      command_suff = site_alias;
      site_alias = '';
    }
    command = "drush_" + command_suff;
    if (typeof allowed_commands[command] === "function") {
      return {
        cmnd: command,
        alias: site_alias,
        args: extra_args
      };
    } else {
      return undefined;
    }
  };
  return {
    // BEGIN public facing methods

    // The main method, fire this when we receive a "drush " command.
    execute: function(msg) {
      var command;
      command = parse_command(msg.match[1]);
      if (command !== undefined) {
        return allowed_commands[command.cmnd](msg, command);
      } else {
        return msg.send("'drush " + msg.match[1] + "' is and invalid command. Please try again.");
      }
    }
  };
};

// Instantiate the drush interface
drush = drush_interface();

// Hook in with hobot
module.exports = function(robot) {
  return robot.respond(/drush (.*)$/i, function(msg) {
    return drush.execute(msg);
  });
};
