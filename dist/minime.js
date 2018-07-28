// Description:
//   Provides a Server-Sent Events path for broadcasting messages to subscribers.

// Dependencies:
//   None

// Commands:
//   hubot minime <message> - sends the message to any subscribers.

// Configuration:
//   None

// Author:
//   jimbojw
module.exports = function(robot) {
  var connections, id;
  
  // collection of open connections (ES6 Set would be preferable if available)
  id = 0;
  connections = {};
  
  // implement SSE
  robot.router.get('/minime/events', function(req, res) {
    req.socket.setTimeout(2e308);
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });
    res.write('\n');
    id = id + 1;
    res.minime_id = id;
    connections[id] = res;
    return res.on('close', function() {
      return delete connections[res.minime_id];
    });
  });
  
  // repackage and post all server sent events to parent window
  robot.router.get('/minime/iframe', function(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    return res.end("<!doctype html>\n<script>\n(function(window){\n  var source = new EventSource(window.location.pathname.replace(/\\/iframe(\\/|$)/, '/events\\1'));\n  source.onmessage = function(e) {\n    window.parent.postMessage(JSON.stringify({\n      from: 'minime',\n      message: JSON.parse(e.data)\n    }), '*');\n  };\n})(window);\n</script>");
  });
  
  // test the iframe
  robot.router.get('/minime/test', function(req, res) {
    res.writeHead(200, {
      'Content-Type': 'text/html'
    });
    return res.end("<!doctype html>\n<html><head></head><body>\n<h1>messages: <h1>\n<script>\n(function(window, document){\n  var iframe = document.createElement('iframe');\n  iframe.height = '1px';\n  iframe.width = '1px';\n  iframe.style.border = 'none';\n  iframe.src = './iframe';\n  window.onmessage = function(event) {\n    var payload = JSON.parse(event.data);\n    if (payload.from === 'minime') {\n      var pre = document.createElement('pre');\n      pre.appendChild(document.createTextNode(event.data));\n      document.body.appendChild(pre);\n    }\n  };\n  document.body.appendChild(iframe);\n})(window, document);\n</script>\n</body></html>");
  });
  
  // send minime messages out to subsribers
  return robot.respond(/(?:mini ?me) (.*)/i, function(msg) {
    var k, res, results, s, subscribers;
    subscribers = Object.keys(connections).length;
    s = subscribers === 1 ? '' : 's';
    if (subscribers) {
      msg.send('publishing to ' + subscribers + ' minime subscriber' + s);
      results = [];
      for (k in connections) {
        res = connections[k];
        results.push(res.write('data: ' + JSON.stringify(msg.match[1]) + '\n\n'));
      }
      return results;
    } else {
      return msg.send('there are no minime subscribers at this time :(');
    }
  });
};
