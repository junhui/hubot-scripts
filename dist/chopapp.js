// Description:
//   Return a link to your chopapp.com code

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot chop [me] [in] <language> <code> - Return a URL of your chopapp snippet (ruby, javascript, php, ...)

// Author:
//   kristofbc
var getUrl;

module.exports = function(robot) {
  return robot.respond(/chop (me )?(in )?(\w+) (.*)$/i, function(msg) {
    return getUrl(msg);
  });
};

getUrl = function(msg) {
  var code, lang, params, url;
  lang = escape(msg.match[3]);
  code = escape(msg.match[4]);
  // Exceptions
  if (lang === 'javascript' || 'js') {
    lang = 'java_script'; // whut
  }
  if (lang === 'c++') {
    lang = 'c';
  }
  if (lang === 'text') {
    lang = 'diff';
  }
  url = 'Drop+in+a+URL...'; // default by chopapp
  params = 'code=' + code + '&language=' + lang + '&url=' + url;
  return msg.http('http://chopapp.com/code_snips').headers({
    "Accept:": "*/*",
    "Content-Type": "application/x-www-form-urlencoded",
    "Content-Length": params.length
  }).post(params)(function(err, res, body) {
    var response;
    if (err) {
      return message.send("Does not compute");
    } else {
      response = JSON.parse(body);
      return msg.send("Here's your code: http://chopapp.com/#" + response.token);
    }
  });
};
