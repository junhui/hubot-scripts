// Description
//   Rdio API

// Configuration:
//   HUBOT_RDIO_KEY
//   HUBOT_RDIO_SECRET

// Commands:
//   <Rdio link> - Show information about the artist/album/track

// Author:
//   smgt
var crypto, http, qs, rdio, url;

qs = require("querystring");

url = require("url");

crypto = require("crypto");

http = require("http");

module.exports = function(robot) {
  return robot.hear(/http:\/\/rd\.io\/x\/[a-zA-Z0-9\-]+\//i, function(msg) {
    return rdio.request("getObjectFromUrl", {
      "url": msg.match[0]
    }, function(err, data) {
      var album, track;
      if (err) {
        return msg.send(`Rdio response: ${err}`);
      } else {
        switch (data.type) {
          case "t":
            track = `${data.artist} - ${data.name}`;
            album = `(${data.album})`;
            return msg.send(`Track: ${track} ${album}`);
          case "r":
            return msg.send(`Artist: ${data.name}`);
          case "a":
            return msg.send(`Album: ${data.artist} - ${data.name}`);
        }
      }
    });
  });
};

rdio = {
  signRequest: function(consumerKey, consumerSecret, urlString, params) {
    var consumer, header, headerParams, hmac, hmacKey, i, key, len, method, nonce, oauthParams, oauthSignature, paramsArray, paramsString, parsedUrl, ref, signatureBase, timestamp, urlBase;
    params = params || [];
    consumer = [consumerKey, consumerSecret];
    method = "POST";
    timestamp = Math.round(new Date().getTime() / 1000).toString();
    nonce = Math.round(Math.random() * 1000000).toString();
    parsedUrl = url.parse(urlString, true);
    if (!Array.isArray(params)) {
      paramsArray = [];
      for (key in params) {
        paramsArray.push([key, params[key]]);
      }
      params = paramsArray;
    }
    params.push(["oauth_version", "1.0"]);
    params.push(["oauth_timestamp", timestamp]);
    params.push(["oauth_nonce", nonce]);
    params.push(["oauth_signature_method", "HMAC-SHA1"]);
    params.push(["oauth_consumer_key", consumer[0]]);
    if (parsedUrl.query) {
      ref = parsedUrl.query;
      for (i = 0, len = ref.length; i < len; i++) {
        key = ref[i];
        params.push([key, parsedUrl.query[key]]);
      }
    }
    hmacKey = consumer[1] + "&";
    params.sort();
    paramsString = params.map(function(param) {
      return qs.escape(param[0]) + "=" + qs.escape(param[1]);
    }).join("&");
    urlBase = url.format({
      protocol: parsedUrl.protocol || "http:",
      hostname: parsedUrl.hostname.toLowerCase(),
      pathname: parsedUrl.pathname
    });
    signatureBase = [method, qs.escape(urlBase), qs.escape(paramsString)].join("&");
    hmac = crypto.createHmac("sha1", hmacKey);
    hmac.update(signatureBase);
    oauthSignature = hmac.digest("base64");
    headerParams = [];
    headerParams.push(["oauth_signature", oauthSignature]);
    oauthParams = ["oauth_version", "oauth_timestamp", "oauth_nonce", "oauth_signature_method", "oauth_signature", "oauth_consumer_key", "oauth_token"];
    params.forEach(function(param) {
      if (oauthParams.indexOf(param[0]) !== -1) {
        return headerParams.push(param);
      }
    });
    header = "OAuth " + headerParams.map(function(param) {
      return param[0] + '="' + param[1] + '"';
    }).join(", ");
    return header;
  },
  request: function(method, params, callback) {
    var auth, content, copy, param, parsedUrl, rdioBaseUrl, req;
    rdioBaseUrl = "http://api.rdio.com/1/";
    copy = {};
    if (typeof params === "function") {
      callback = params;
      params = null;
    }
    if (params) {
      for (param in params) {
        copy[param] = params[param];
      }
    }
    copy.method = method;
    auth = this.signRequest(process.env.HUBOT_RDIO_KEY, process.env.HUBOT_RDIO_SECRET, rdioBaseUrl, copy);
    parsedUrl = url.parse(rdioBaseUrl);
    content = qs.stringify(copy);
    req = http.request({
      method: "POST",
      host: parsedUrl.host,
      port: parsedUrl.port || "80",
      path: parsedUrl.pathname,
      headers: {
        "Authorization": auth,
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": content.length.toString()
      }
    }, function(res) {
      var body;
      body = "";
      res.setEncoding("utf8");
      res.on("data", function(chunk) {
        return body += chunk;
      });
      return res.on("end", function() {
        var data, error;
        data = {};
        try {
          data = JSON.parse(body);
        } catch (error1) {
          error = error1;
          data.status = 'error';
          data.message = body;
        }
        if (data.status === "error") {
          return callback(data.message);
        } else {
          return callback(null, data.result);
        }
      });
    });
    req.on("error", function(err) {
      return callback(err);
    });
    return req.end(content);
  }
};
