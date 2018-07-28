// Description:
//   Auth allows you to assign roles to users which can be used by other scripts
//   to restrict access to Hubot commands

// Dependencies:
//   None

// Configuration:
//   HUBOT_AUTH_ADMIN

// Commands:
//   hubot <user> has <role> role - Assigns a role to a user
//   hubot <user> doesn't have <role> role - Removes a role from a user
//   hubot what role does <user> have - Find out what roles are assigned to a specific user
//   hubot who has admin role - Find out who's an admin and can assign roles

// Notes:
//   * Call the method: robot.Auth.hasRole('<user>','<role>')
//   * returns bool true or false

//   * the 'admin' role can only be assigned through the environment variable
//   * roles are all transformed to lower case

// Author:
//   alexwilliamsca
var indexOf = [].indexOf;

module.exports = function(robot) {
  var Auth, admin;
  admin = process.env.HUBOT_AUTH_ADMIN;
  Auth = class Auth {
    hasRole(name, role) {
      var user;
      user = robot.brain.userForName(name);
      if ((user != null) && (user.roles != null)) {
        if (indexOf.call(user.roles, role) >= 0) {
          return true;
        }
      }
      return false;
    }

  };
  robot.Auth = new Auth;
  robot.respond(/@?(.+) (has) (["'\w: -_]+) (role)/i, function(msg) {
    var myRoles, name, newRole, ref, ref1, user;
    name = msg.match[1].trim();
    newRole = msg.match[3].trim().toLowerCase();
    if ((ref = name.toLowerCase()) !== '' && ref !== 'who' && ref !== 'what' && ref !== 'where' && ref !== 'when' && ref !== 'why') {
      user = robot.brain.userForName(name);
      if (user == null) {
        msg.reply(`${name} does not exist`);
        return;
      }
      user.roles = user.roles || [];
      if (indexOf.call(user.roles, newRole) >= 0) {
        return msg.reply(`${name} already has the '${newRole}' role.`);
      } else {
        if (newRole === 'admin') {
          return msg.reply("Sorry, the 'admin' role can only be defined in the HUBOT_AUTH_ADMIN env variable.");
        } else {
          myRoles = msg.message.user.roles || [];
          if (ref1 = msg.message.user.name.toLowerCase(), indexOf.call(admin.toLowerCase().split(','), ref1) >= 0) {
            user.roles.push(newRole);
            return msg.reply(`Ok, ${name} has the '${newRole}' role.`);
          }
        }
      }
    }
  });
  robot.respond(/@?(.+) (doesn't have|does not have) (["'\w: -_]+) (role)/i, function(msg) {
    var myRoles, name, newRole, ref, ref1, role, user;
    name = msg.match[1].trim();
    newRole = msg.match[3].trim().toLowerCase();
    if ((ref = name.toLowerCase()) !== '' && ref !== 'who' && ref !== 'what' && ref !== 'where' && ref !== 'when' && ref !== 'why') {
      user = robot.brain.userForName(name);
      if (user == null) {
        msg.reply(`${name} does not exist`);
        return;
      }
      user.roles = user.roles || [];
      if (newRole === 'admin') {
        return msg.reply("Sorry, the 'admin' role can only be removed from the HUBOT_AUTH_ADMIN env variable.");
      } else {
        myRoles = msg.message.user.roles || [];
        if (ref1 = msg.message.user.name.toLowerCase(), indexOf.call(admin.toLowerCase().split(','), ref1) >= 0) {
          user.roles = (function() {
            var i, len, ref2, results;
            ref2 = user.roles;
            results = [];
            for (i = 0, len = ref2.length; i < len; i++) {
              role = ref2[i];
              if (role !== newRole) {
                results.push(role);
              }
            }
            return results;
          })();
          return msg.reply(`Ok, ${name} doesn't have the '${newRole}' role.`);
        }
      }
    }
  });
  robot.respond(/(what role does|what roles does) @?(.+) (have)\?*$/i, function(msg) {
    var isAdmin, name, ref, user;
    name = msg.match[2].trim();
    user = robot.brain.userForName(name);
    if (user == null) {
      msg.reply(`${name} does not exist`);
      return;
    }
    user.roles = user.roles || [];
    if (ref = name.toLowerCase(), indexOf.call(admin.toLowerCase().split(','), ref) >= 0) {
      isAdmin = ' and is also an admin';
    } else {
      isAdmin = '';
    }
    return msg.reply(`${name} has the following roles: ` + user.roles + isAdmin + ".");
  });
  return robot.respond(/who has admin role\?*$/i, function(msg) {
    return msg.reply(`The following people have the 'admin' role: ${admin.split(',')}`);
  });
};
