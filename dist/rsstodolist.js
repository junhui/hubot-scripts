// Description:
//   Allows you to send links to the RssToDoList service

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot rtdl show <user_name> - Display the <user_name> RssToDoList feed url
//   hubot rtdl add <user_name> <link> - Send the <link> to <user_name> RssToDoList feed
//   hubot rtdl last <user_name> <limit> - Display last links for that <user_name> (you can specify an optional <limit>)

// Author:
//   athieriot
//   paulgreg
var jsdom;

jsdom = require('jsdom');

module.exports = function(robot) {
  return robot.respond(/rtdl (add|show|last) ([^ ]*)( .*)?/i, function(msg) {
    var action, arg, server_url, user_name;
    server_url = 'http://rsstodolist.appspot.com';
    [action, user_name, arg] = [msg.match[1], escape(msg.match[2]), msg.match[3]];
    if (action === 'add' && arg !== void 0) {
      return msg.http(server_url + '/add').query({
        n: user_name
      }).query({
        url: arg.trim()
      }).get()(function(err, res, body) {
        var status;
        status = res.statusCode;
        if (status === 200 || status === 302) {
          return msg.reply('The feed of ' + user_name + ' is updated');
        } else {
          return msg.reply("An error occured on " + user_name + " feed");
        }
      });
    } else if (action === 'show') {
      return msg.reply(user_name + ' feed is ' + server_url + '/?n=' + user_name);
    } else if (action === 'last') {
      return msg.http(server_url + '/').query({
        n: user_name
      }).query({
        l: arg || 10
      }).get()(function(err, res, body) {
        var i, item, len, ref, reply, xml;
        try {
          reply = '';
          xml = jsdom.jsdom(body);
          ref = xml.getElementsByTagName("rss")[0].getElementsByTagName("channel")[0].getElementsByTagName("item");
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            (function(item) {
              var description, descriptionNode, link, title;
              link = item.getElementsByTagName("link")[0].childNodes[0].nodeValue;
              title = item.getElementsByTagName("title")[0].childNodes[0].nodeValue;
              descriptionNode = item.getElementsByTagName("description")[0];
              if (descriptionNode.childNodes.length === 1) {
                description = descriptionNode.childNodes[0].nodeValue;
              }
              reply += ` - ${title},`;
              if (description != null) {
                reply += ` ${description}`;
              }
              return reply += ` (${link})\n`;
            })(item);
          }
        } catch (error) {
          err = error;
          msg.reply(err);
        }
        return msg.reply(reply);
      });
    }
  });
};
