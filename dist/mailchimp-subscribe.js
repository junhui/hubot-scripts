// Description:
//   Add email to Mailchimp list

// Dependencies:
//   "mailchimp": "1.1.0"

// Configuration:
//   MAILCHIMP_API_KEY
//   MAILCHIMP_LIST_ID

// Commands:
//   hubot subscribe <email> - Add email to list

// Author:
//   max, lmarburger
var MailChimpAPI, apiKey, listId, subscribeToList;

MailChimpAPI = require('mailchimp').MailChimpAPI;

apiKey = process.env.MAILCHIMP_API_KEY;

listId = process.env.MAILCHIMP_LIST_ID;

module.exports = function(robot) {
  return robot.respond(/subscribe (.+@.+)/i, function(message) {
    return subscribeToList(message);
  });
};

subscribeToList = function(message) {
  var api, emailAddress, error;
  emailAddress = message.match[1];
  try {
    api = new MailChimpAPI(apiKey, {
      version: "1.3",
      secure: false
    });
  } catch (error1) {
    error = error1;
    console.log(error.message);
    return;
  }
  return api.listSubscribe({
    id: listId,
    email_address: emailAddress,
    double_optin: false
  }, function(error, data) {
    if (error) {
      return message.send(`Uh oh, something went wrong: ${error.message}`);
    } else {
      return message.send(`You succesfully subscribed ${emailAddress}.`);
    }
  });
};
