// Description:
//   Allows Hubot to find an awesome Mitch Hedberg quotes

// Dependencies:
//   "htmlparser": "1.7.6"
//   "soupselect": "0.2.0"
//   "jsdom": "0.2.14"
//   "underscore": "1.3.3"

// Configuration:
//   None

// Commands:
//   hubot get mitch - This spits out one of the many awesome Mitch Hedberg quotes from wikiquote.org with filter
//   hubot get dirty mitch - This spits out one of the many awesome Mitch Hedberg quotes from wikiquote.org without potty mouth filter

// Author:
//   nickfloyd
var HtmlParser, JsDom, Select, StaticQuotes, _, childern_of_type, get_dom, get_quote, keep_it_clean, parse_html;

Select = require("soupselect").select;

HtmlParser = require("htmlparser");

JsDom = require("jsdom");

_ = require("underscore");

StaticQuotes = ["A severed foot is the ultimate stocking stuffer.", "I hope the next time I move I get a real easy phone number, something that's real easy to remember. Something like two two two two two two two. I would say \"Sweet.\" And then people would say, \"Mitch, how do I get a hold of you?\" I'd say, \"Just press two for a while and when I answer, you will know you have pressed two enough.", "My friend asked me if I wanted a frozen banana, I said \"No, but I want a regular banana later, so ... yeah\".", "On a traffic light green means 'go' and yellow means 'yield', but on a banana it's just the opposite. Green means 'hold on,' yellow means 'go ahead,' and red means, 'where did you get that banana ?'", "I'm against picketing, but I don't know how to show it.", "I think Bigfoot is blurry, that's the problem. It's not the photographer's fault. Bigfoot is blurry, and that's extra scary to me. There's a large, out-of-focus monster roaming the countryside. Run, he's fuzzy, get out of here.", "One time, this guy handed me a picture of him, he said,\"Here's a picture of me when I was younger.\" Every picture is of you when you were younger. ", "My fake plants died because I did not pretend to water them.", "I walked into Target, but I missed. I think the entrance to Target should have people splattered all around. And, when I finally get in, the guy says, \"Can I help you?\" \"Just practicing.\"", "When I was a boy, I laid in my twin-sized bed and wondered where my brother was.", "Is a hippopotamus a hippopotamus or just a really cool opotamus?", "If I had a dollar for every time I said that, I'd be making money in a very weird way.", "My belt holds up my pants and my pants have belt loops that hold up the belt. What's really goin on down there? Who is the real hero?", "I'm an ice sculptor - last night I made a cube.", "If you have dentures, don't use artificial sweetener, cause you'll get a fake cavity.", "I saw this dude, he was wearing a leather jacket, and at the same time he was eating a hamburger and drinking a glass of milk. I said to him \"Dude, you're a cow. The metamorphosis is complete. Don't fall asleep or I'll tip you over.\"", "A burrito is a sleeping bag for ground beef.", "Here's a thought for sweat shop owners: Air Conditioning. Problem solved.", "I saw a sheet lying on the floor, it must have been a ghost that had passed out... So I kicked it.", "The Kit-Kat candy bar has the name 'Kit-Kat' imprinted into the chocolate. That robs you of chocolate!"];

module.exports = function(robot) {
  return robot.respond(/get( dirty)? mitch$/i, function(msg) {
    return msg.http("http://en.wikiquote.org/wiki/Mitch_Hedberg").header("User-Agent: Mitchbot for Hubot (+https://github.com/github/hubot-scripts)").get()(function(err, res, body) {
      var quote, quotes;
      quotes = parse_html(body, "li");
      return quote = get_quote(msg, quotes);
    });
  });
};

get_quote = function(msg, quotes) {
  var nodeChildren, pottyParm, quote, textNode;
  if (msg.match[1] !== void 0) {
    pottyParm = msg.match[1].replace(/^\s+|\s+$/g, "");
  }
  nodeChildren = _.flatten(childern_of_type(quotes[Math.floor(Math.random() * quotes.length)]));
  quote = ((function() {
    var i, len, results;
    results = [];
    for (i = 0, len = nodeChildren.length; i < len; i++) {
      textNode = nodeChildren[i];
      results.push(textNode.data);
    }
    return results;
  })()).join('');
  if (pottyParm === "dirty") {
    return msg.send(quote);
  } else {
    return keep_it_clean(msg, quote, function(body, err) {
      if (err) {
        msg.send(StaticQuotes[Math.floor(Math.random() * StaticQuotes.length)]);
      }
      
      //because potty word just sounds funny
      return msg.send(body.getElementsByTagName("CleanText")[0].firstChild.nodeValue.replace(/(Explicit)+/g, "potty word"));
    });
  }
};

// Helpers		
parse_html = function(html, selector) {
  var handler, parser;
  handler = new HtmlParser.DefaultHandler((function() {}), {
    ignoreWhitespace: true
  });
  parser = new HtmlParser.Parser(handler);
  parser.parseComplete(html);
  return Select(handler.dom, selector);
};

childern_of_type = function(root) {
  var child, ref;
  if ((root != null ? root.type : void 0) === "text") {
    return [root];
  }
  if ((root != null ? (ref = root.children) != null ? ref.length : void 0 : void 0) > 0) {
    return (function() {
      var i, len, ref1, results;
      ref1 = root.children;
      results = [];
      for (i = 0, len = ref1.length; i < len; i++) {
        child = ref1[i];
        results.push(childern_of_type(child));
      }
      return results;
    })();
  }
};

get_dom = function(xml) {
  var body;
  body = JsDom.jsdom(xml);
  if (body.getElementsByTagName("FilterReturn")[0].childNodes.length === 0) {
    throw Error("No XML data returned.");
  }
  return body;
};

keep_it_clean = function(msg, quote, cb) {
  return msg.http("http://wsf.cdyne.com/ProfanityWS/Profanity.asmx/SimpleProfanityFilter").query({
    Text: quote
  }).get()(function(err, res, body) {
    try {
      body = get_dom(body);
    } catch (error) {
      err = error;
      err = "Could not clean potty words.";
    }
    return cb(body, err);
  });
};
