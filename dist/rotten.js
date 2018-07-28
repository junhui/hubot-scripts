// Description:
//   Grabs movie scores from Rotten Tomatoes

// Dependencies:
//   None

// Configuration:
//   HUBOT_ROTTEN_TOMATOES_API_KEY

// Commands:
//   hubot rotten [me] <movie>
//   hubot what's in theaters?
//   hubot what's coming out in theaters?
//   hubot what's coming out on (dvd|bluray)? - there is not a distinction between dvd and bluray

// Author:
//   mportiz08
var Rotten, RottenMovie;

Rotten = class Rotten {
  constructor(robot1) {
    this._links = this._links.bind(this);
    this._movie_links = this._movie_links.bind(this);
    this._dvd_links = this._dvd_links.bind(this);
    this.in_theaters = this.in_theaters.bind(this);
    this.upcoming = this.upcoming.bind(this);
    this.search = this.search.bind(this);
    this.send = this.send.bind(this);
    this.robot = robot1;
    this.api_url = "http://api.rottentomatoes.com/api/public/v1.0";
    this.api_key = process.env.HUBOT_ROTTEN_TOMATOES_API_KEY;
  }

  _links(match, callback) {
    if (this.__links) {
      return callback(this.__links[match]);
    }
    return this.send(`${this.api_url}/lists.json`, {}, (err, res, body) => {
      this.__links = JSON.parse(body)['links'];
      return callback(this.__links[match]);
    });
  }

  _movie_links(match, callback) {
    if (this.__movie_links) {
      return callback(this.__movie_links[match]);
    }
    return this._links('movies', (link) => {
      return this.send(link, {}, (err, res, body) => {
        this.__movie_links = JSON.parse(body)['links'];
        return callback(this.__movie_links[match]);
      });
    });
  }

  _dvd_links(match, callback) {
    if (this.__dvd_links) {
      return callback(this.__dvd_links[match]);
    }
    return this._links('dvds', (link) => {
      return this.send(link, {}, (err, res, body) => {
        this.__dvd_links = JSON.parse(body)['links'];
        return callback(this.__dvd_links[match]);
      });
    });
  }

  in_theaters(callback) {
    return this._movie_links('in_theaters', (match) => {
      return this.send(match, {
        page_limit: 20,
        country: 'us'
      }, function(err, res, body) {
        var movie, movies;
        movies = JSON.parse(body)['movies'];
        if (!((err != null) || (movies != null))) {
          return callback("Couldn't find anything, sorry.");
        }
        return callback(null, (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = movies.length; i < len; i++) {
            movie = movies[i];
            results.push(new RottenMovie(movie));
          }
          return results;
        })());
      });
    });
  }

  upcoming(type, callback) {
    var link_list;
    link_list = (function() {
      switch (type) {
        case 'movies':
          return this._movie_links;
        case 'dvds':
          return this._dvd_links;
        default:
          return this._movie_links;
      }
    }).call(this);
    return link_list('upcoming', (match) => {
      return this.send(match, {
        page_limit: 20,
        country: 'us'
      }, function(err, res, body) {
        var movie, movies;
        movies = JSON.parse(body)['movies'];
        if (!((err != null) || (movies != null))) {
          return callback("Couldn't find anything, sorry.");
        }
        return callback(null, (function() {
          var i, len, results;
          results = [];
          for (i = 0, len = movies.length; i < len; i++) {
            movie = movies[i];
            results.push(new RottenMovie(movie));
          }
          return results;
        })());
      });
    });
  }

  search(query, callback) {
    this.send(`${this.api_url}/movies.json`, {
      q: query,
      page_limit: 1
    }, function(err, res, body) {
      var movie;
      movie = JSON.parse(body)['movies'][0];
      if (!((err != null) || (movie != null))) {
        return callback("Couldn't find anything, sorry.");
      }
      return callback(null, new RottenMovie(movie));
    });
  }

  send(url, options, callback) {
    options.apikey = this.api_key;
    return this.robot.http(url).query(options).get()(callback);
  }

};

RottenMovie = class RottenMovie {
  constructor(info) {
    this.info = info;
  }

  toDetailedString() {
    return `${this.info['title']} (${this.info['year']})\n` + `${this.info['runtime']} min, ${this.info['mpaa_rating']}\n\n` + "Critics:\t" + `${this.info['ratings']['critics_score']}%` + `\t"${this.info['ratings']['critics_rating']}"\n` + "Audience:\t" + `${this.info['ratings']['audience_score']}%` + `\t"${this.info['ratings']['audience_rating']}"\n\n` + `${this.info['critics_consensus']}`;
  }

  toReleaseString() {
    return `${this.info['title']}, ${this.info['release_dates']['dvd'] || this.info['release_dates']['theater']} (${this.info['ratings']['audience_score']}%)`;
  }

  toString() {
    return `${this.info['title']} (${this.info['ratings']['audience_score']}%)`;
  }

};

module.exports = function(robot) {
  var rotten;
  rotten = new Rotten(robot);
  robot.respond(/rotten (me )?(.*)$/i, function(message) {
    message.send("Well, let's see...");
    return rotten.search(message.match[2], function(err, movie) {
      if (err == null) {
        return message.send(movie.toDetailedString());
      } else {
        return message.send(err);
      }
    });
  });
  robot.respond(/what(\')?s in theaters(\?)?$/i, function(message) {
    message.send("Well, let's see...");
    return rotten.in_theaters(function(err, movies) {
      var movie;
      if (err == null) {
        return message.send(((function() {
          var i, len, results;
          results = [];
          for (i = 0, len = movies.length; i < len; i++) {
            movie = movies[i];
            results.push(movie.toString());
          }
          return results;
        })()).join("\n"));
      } else {
        return message.send(err);
      }
    });
  });
  return robot.respond(/what(\')?s coming out ((on (dvd|blu(-)?ray))|(in theaters))(\?)?$/i, function(message) {
    var type;
    message.send("Well, let's see...");
    type = message.match[2] === 'in theaters' ? 'movies' : 'dvds';
    return rotten.upcoming(type, function(err, movies) {
      var movie;
      if (err == null) {
        return message.send(((function() {
          var i, len, results;
          results = [];
          for (i = 0, len = movies.length; i < len; i++) {
            movie = movies[i];
            results.push(movie.toReleaseString());
          }
          return results;
        })()).join("\n"));
      } else {
        return message.send(err);
      }
    });
  });
};
