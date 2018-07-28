// Description:
//   Trac interaction script

// Dependencies:
//   "xml2js": "0.1.14"

// Configuration:
//   HUBOT_TRAC_URL: Base URL to Trac instance, without trailing slash eg: https://myserver.com/trac
//   HUBOT_TRAC_USER: Trac username (uses HTTP basic authentication)
//   HUBOT_TRAC_PASSWORD: Trac password

// Optional Configuration:
//   HUBOT_TRAC_JSONRPC: "true" to use the Trac http://trac-hacks.org/wiki/XmlRpcPlugin.
//                       Requires jsonrpc to be enabled in the plugin. Default to "true".
//   HUBOT_TRAC_SCRAPE: "true" to use HTTP scraping to pull information from Trac. 
//                      Defaults to "true".
//   HUBOT_TRAC_LINKDELAY: number of seconds to not show a link for again after it's been
//                         mentioned once. This helps to cut down on noise from the bot.
//                         Defaults to 30.
//   HUBOT_TRAC_IGNOREUSERS: Comma-seperated list of users to ignore "hearing" issues from.
//                           This works well with other bots or API calls that post to the room.
//                           Example: "Subversion,TeamCity,John Doe"
// Commands:
//   #123 - Show details about a Trac ticket
//   Full ticket URL - Show details about a Trac ticket
//   r123 - Show details about a commit
//   [123] - Show details about a commit

// Notes: 
//   Tickets pull from jsonrpc (if enabled), then scraping (if enabled), and otherwise just put a link
//   Revisions pull from scraping (if enabled), and otherwise just post a link. (There are no xmlrpc methods
//   for changeset data).

// Author:
//   gregmac
var RecentIssues, jquery, jsdom;

jsdom = require('jsdom');

//fs = require 'fs'  #todo: load jquery from filesystem
jquery = 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js';

// keeps track of recently displayed issues, to prevent spamming
RecentIssues = class RecentIssues {
  constructor(maxage) {
    this.maxage = maxage;
    this.issues = [];
  }

  cleanup() {
    var age, issue, ref, time;
    ref = this.issues;
    for (issue in ref) {
      time = ref[issue];
      age = Math.round(((new Date()).getTime() - time) / 1000);
      if (age > this.maxage) {
        //console.log 'removing old issue', issue
        delete this.issues[issue];
      }
    }
  }

  contains(issue) {
    this.cleanup();
    return this.issues[issue] != null;
  }

  add(issue, time) {
    time = time || (new Date()).getTime();
    return this.issues[issue] = time;
  }

};

module.exports = function(robot) {
  var changesetScrape, fetchTicket, handleChangeset, ignoredusers, jsonRpc, linkdelay, recentlinks, scrapeHttp, ticketRpc, ticketScrape, ticketUrl, useJsonrpc, useScrape;
  // if trac json-rpc is available to use for retreiving tickets (faster)
  useJsonrpc = process.env.HUBOT_TRAC_JSONRPC || false;
  // if screen scraping can be used for tickets/changesets. If both jsonrpc and scrape are off, only a link gets posted
  useScrape = process.env.HUBOT_TRAC_SCRAPE || true;
  // how long (seconds) to wait between repeating the same link
  linkdelay = process.env.HUBOT_TRAC_LINKDELAY || 30;
  // array of users that are ignored
  ignoredusers = (process.env.HUBOT_TRAC_IGNOREUSERS != null ? process.env.HUBOT_TRAC_IGNOREUSERS.split(',') : void 0) || [];
  recentlinks = new RecentIssues(linkdelay);
  
  // scrape a URL
  // selectors: an array of jquery selectors
  // callback: function that takes (error,response)
  scrapeHttp = function(msg, url, user, pass, selectors, callback) {
    var authdata;
    authdata = new Buffer(user + ':' + pass).toString('base64');
    return msg.http(url).header('Authorization', 'Basic ' + authdata).get()(function(err, res, body) {
      // http errors
      if (err) {
        callback(err, body);
        return;
      }
      return jsdom.env(body, [jquery], function(errors, window) {
        var results, selector;
        // use jquery to run selector and return the elements
        results = (function() {
          var i, len, results1;
          results1 = [];
          for (i = 0, len = selectors.length; i < len; i++) {
            selector = selectors[i];
            results1.push(window.$(selector).text().trim());
          }
          return results1;
        })();
        return callback(null, results);
      });
    });
  };
  // call a json-rpc method
  // callback is passed (error,response) 
  // borrowed heavily from https://github.com/andyfowler/node-jsonrpc-client/
  jsonRpc = function(msg, url, user, pass, method, params, callback) {
    var authdata, jsonrpcParams;
    authdata = new Buffer(user + ':' + pass).toString('base64');
    jsonrpcParams = {
      jsonrpc: '2.0',
      id: (new Date).getTime(),
      method: method,
      params: params
    };
    console.log(url, JSON.stringify(jsonrpcParams));
    return msg.http(url).header('Authorization', 'Basic ' + authdata).header('Content-Type', 'application/json').post(JSON.stringify(jsonrpcParams))(function(err, res, body) {
      var decodeError, decodedResponse, errorMessage;
      // http errors
      if (err) {
        callback(err, body);
        return;
      }
      try {
        // response json parse errors
        decodedResponse = JSON.parse(body);
      } catch (error) {
        decodeError = error;
        callback('Could not decode JSON response', body);
        return;
      }
      
      //json-rpc errors
      if (decodedResponse.error) {
        errorMessage = ` ${decodedResponse.error.message}`;
        callback(errorMessage, decodedResponse.error.data);
        return;
      }
      return callback(null, decodedResponse.result);
    });
  };
  
  // fetch a ticket using json-rpc
  ticketRpc = function(msg, ticket) {
    return jsonRpc(msg, process.env.HUBOT_TRAC_URL + '/login/jsonrpc', process.env.HUBOT_TRAC_USER, process.env.HUBOT_TRAC_PASSWORD, 'ticket.get', [ticket], function(err, response) {
      var issue, ticketid, url;
      if (err) {
        console.log('Error retrieving trac ticket', ticket, err);
        return;
      }
      ticketid = response[0];
      issue = response[3];
      if (!ticketid) {
        console.log('Error understanding trac response', ticket, response);
        return;
      }
      url = process.env.HUBOT_TRAC_URL + "/ticket/" + ticketid;
      return msg.send(`Trac \#${ticketid}: ${issue.summary}. ${issue.owner} / ${issue.status}, ${issue.milestone} ${url}`);
    });
  };
  // fetch a ticket using http scraping
  ticketScrape = function(msg, ticket) {
    return scrapeHttp(msg, process.env.HUBOT_TRAC_URL + '/ticket/' + ticket, process.env.HUBOT_TRAC_USER, process.env.HUBOT_TRAC_PASSWORD, ['#ticket h2.summary', 'td[headers=h_owner]', '#trac-ticket-title .status', 'td[headers=h_milestone]'], function(err, response) {
      var url;
      console.log('scrape response', response);
      url = process.env.HUBOT_TRAC_URL + "/ticket/" + ticket;
      return msg.send(`Trac \#${ticket}: ${response[0]}. ${response[1]} / ${response[2]}, ${response[3]} ${url}`);
    });
  };
  // fetch a changeset using http scraping
  changesetScrape = function(msg, revision) {
    return scrapeHttp(msg, process.env.HUBOT_TRAC_URL + '/changeset/' + revision, process.env.HUBOT_TRAC_USER, process.env.HUBOT_TRAC_PASSWORD, ['#content.changeset dd.message', '#content.changeset dd.author', '#content.changeset dd.time'], function(err, response) {
      var author, i, len, line, message, ref, results1, time, url;
      console.log('scrape response', response);
      url = process.env.HUBOT_TRAC_URL + "/changeset/" + revision;
      author = response[1];
      time = response[2].replace(/[\n ]{2,}/, ' ');
      message = response[0];
      msg.send(`Trac r${revision}: ${author} ${time} ${url}`);
      ref = message.split("\n");
      results1 = [];
      for (i = 0, len = ref.length; i < len; i++) {
        line = ref[i];
        results1.push(msg.send(line));
      }
      return results1;
    });
  };
  // fetch ticket information using scraping or jsonrpc
  fetchTicket = function(msg) {
    var i, len, linkid, matched, ref, results1, ticket;
    if (ignoredusers.some(function(user) {
      return user === msg.message.user.name;
    })) {
      console.log('ignoring user due to blacklist:', msg.message.user.name);
      return;
    }
    ref = msg.match;
    results1 = [];
    for (i = 0, len = ref.length; i < len; i++) {
      matched = ref[i];
      ticket = (matched.match(/\d+/))[0];
      linkid = msg.message.user.room + '#' + ticket;
      if (!recentlinks.contains(linkid)) {
        recentlinks.add(linkid);
        console.log('trac ticket link', ticket);
        if (useJsonrpc) {
          results1.push(ticketRpc(msg, ticket));
        } else if (useScrape) {
          results1.push(ticketScrape(msg, ticket));
        } else {
          results1.push(msg.send(`Trac \#${ticket}: ${process.env.HUBOT_TRAC_URL}/ticket/${ticket}`));
        }
      } else {
        results1.push(void 0);
      }
    }
    return results1;
  };
  // listen for ticket numbers
  robot.hear(/([^\w]|^)\#(\d+)(?=[^\w]|$)/ig, fetchTicket);
  // listen for ticket links
  ticketUrl = new RegExp(`${process.env.HUBOT_TRAC_URL}/ticket/([0-9]+)`, 'ig');
  robot.hear(ticketUrl, fetchTicket);
  // listen for changesets 
  handleChangeset = function(msg) {
    var i, len, linkid, matched, ref, results1, revision;
    if (ignoredusers.some(function(user) {
      return user === msg.message.user.name;
    })) {
      console.log('ignoring user due to blacklist:', msg.message.user.name);
      return;
    }
    ref = msg.match;
    results1 = [];
    for (i = 0, len = ref.length; i < len; i++) {
      matched = ref[i];
      revision = (matched.match(/\d+/))[0];
      linkid = msg.message.user.room + 'r' + revision;
      if (!recentlinks.contains(linkid)) {
        recentlinks.add(linkid);
        console.log('trac changset link', revision);
        // note, trac has no API methods for changesets, all we can do is scrape
        if (useScrape) {
          results1.push(changesetScrape(msg, revision));
        } else {
          results1.push(msg.send(`Trac r${revision}: ${process.env.HUBOT_TRAC_URL}/changeset/${revision}`));
        }
      } else {
        results1.push(void 0);
      }
    }
    return results1;
  };
  // trigger on "r123"
  robot.hear(/([^\w]|^)r(\d+)(?=[^\w]|$)/ig, handleChangeset);
  // trigger on [123]
  return robot.hear(/([^\w]|^)\[(\d+)\](?=[^\w]|$)/ig, handleChangeset);
};
