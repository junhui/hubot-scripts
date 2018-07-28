// Description:
//   Display issue/page information from drupal.org

// Dependencies:
//   "jsdom" : ">0.2.1"
//   "request" : ""

// Configuration:
//   NONE

// Commands:
//   Drupal.org url - Show details about a drupal.org page or issue

// Notes:
//   HUBOT_DRUPALORG_LINKDELAY: number of seconds to not respond to a link again after it's been
//                             mentioned once. This helps to cut down on noise from the bot.
//                             Defaults to 30.

// Author:
//   guyoron
var RecentIssues, jquery, jsdom, request;

request = require('request');

jsdom = require('jsdom');

jquery = 'http://ajax.googleapis.com/ajax/libs/jquery/1.7.2/jquery.min.js';

// keeps track of recently displayed pages, to prevent spamming
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
  var fetchPage, linkDelay, outputIssue, outputPage, recentLinks, scrape;
  // how long (seconds) to wait between repeating the same link
  linkDelay = process.env.HUBOT_DRUPALORG_LINKDELAY || 30;
  recentLinks = new RecentIssues(linkDelay);
  
  // scrape (already retrieved) HTML
  // selectors: an array of jquery selectors
  // callback: function that takes scrape results
  scrape = function(body, selectors, callback) {
    return jsdom.env(body, [jquery], function(errors, window) {
      var selector;
      // use jquery to run selector and return the elements
      return callback((function() {
        var i, len, results1;
        results1 = [];
        for (i = 0, len = selectors.length; i < len; i++) {
          selector = selectors[i];
          results1.push(window.$(selector).text().trim());
        }
        return results1;
      })());
    });
  };
  // fetch a drupal.org page using http scraping
  fetchPage = function(msg) {
    var url;
    url = msg.match[0];
    if (recentLinks.contains(url)) {
      return;
    }
    recentLinks.add(url);
    return request({
      url: url,
      headers: {
        'User-Agent': 'hubot'
      }
    }, function(err, res, body) {
      if (err) {
        console.log(`Errors getting url: ${url}`);
        return;
      }
      
      // check if this is an issue or non-issue page 
      return scrape(body, ['#project-issue-summary-table tbody tr:first-child td:last-child', 'dl.about-section dd:nth-child(2)'], function(result) {
        if (result[0] !== '') {
          return outputIssue(msg, url, body);
        } else if (result[1] !== '') {
          return outputPage(msg, url, body);
        } else {
          return console.log(`Errors scraping url: ${url}`);
        }
      });
    });
  };
  // outputs info about a d.o issue, given a scrape response
  outputIssue = function(msg, url, body) {
    return scrape(body, [
      '#page-subtitle', // title
      '#project-issue-summary-table tbody tr:first-child td:last-child', // project name
      '#project-issue-summary-table tbody tr:last-child td:last-child', // status
      'div.comment:last-child h3.comment-title a', // last comment number
      'div.project-issue-follow-count' // follower count
    ], function(results) {
      var commentNumber, comments;
      commentNumber = results[3].substring(1);
      if (commentNumber !== '') {
        comments = commentNumber + " comments";
      } else {
        comments = "0 comments";
      }
      return msg.send(`${url} => ${results[0]} [${results[1]}, ${results[2]}, ${comments}, ${results[4]}]`);
    });
  };
  // outputs info about a d.o non-issue page, given a scrape response
  outputPage = function(msg, url, body) {
    return scrape(body, [
      '#page-subtitle', // title
      'dl.about-section dd:nth-child(2)', // drupal versions
      'dl.about-section dd:last-child' // audience
    ], function(results) {
      return msg.send(`${url} => ${results[0]} [${results[1]}, ${results[2]}]`);
    });
  };
  // listen for page links
  return robot.hear(/https?:\/\/(www.)?drupal.org\/node\/(\d+)/, fetchPage);
};
