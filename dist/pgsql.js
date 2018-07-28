// Description:
//   Strip help information from the Postgres web documentation.
//   Example: hubot pgsql 9.0 select

// Dependencies:
//   None

// Configuration:
//   None

// Commands:
//   hubot pgsql <version> <sql>

// Author:
//   mwongatemma
module.exports = function(robot) {
  return robot.respond(/pgsql\s+(\d.\d)?\s+(.+)$/i, function(msg) {
    var sql, url, ver;
    ver = msg.match[1];
    sql = msg.match[2].toLowerCase();
    sql = sql.replace(/[\s]/g, '');
    url = 'http://www.postgresql.org/docs/' + ver + '/static/sql-' + sql + '.html';
    return msg.http(url).get()(function(err, res, body) {
      var end, start, synopsis;
      start = body.indexOf('<h2>Synopsis</h2>');
      start = body.indexOf('\n', start);
      start = body.indexOf('\n', start);
      end = body.indexOf('</pre>', start);
      synopsis = body.substr(start + 1, end - start - 2);
      return msg.send(synopsis.replace(/<[\s\S]+?>/g, ''));
    });
  });
};
