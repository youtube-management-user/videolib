var http = require('http'),
    fs = require('fs'),
    util = require('util'),
    querystring = require('querystring'),
    urllib = require('url'),
    ejs = require("ejs"),
    glob = require("glob"),
    process = require("process");

const PORT = process.argv[2] || 9300;

const log = require('simple-node-logger').createSimpleFileLogger('project.log');

http.createServer(function (req, res) {
  var path = req.url.split('/');
  var route = path[1];
  var filename = path[2];
  var query = '';
  if (filename && filename.indexOf('?')>0) {
    query = querystring.parse(filename.split('?')[1]);
    filename = filename.split('?')[0];
  }
  const referer = urllib.parse(req.headers.referer || '').hostname;

  log.info(`Video server: access from ${req.headers["x-forwarded-for"]} for ${route}`);

  if (route == 'video') {
      var path = "videos/" + filename;
      if (!fs.existsSync(path)) {
        log.info(`Video server: file ${filename} not found`);
        res.setHeader("Content-Type", "text/html");
        res.writeHead(404);
        res.end(`File ${filename} is not found`);
      } else {
        var stat = fs.statSync(path);
        var total = stat.size;
        if (req.headers['range']) {
          var range = req.headers.range;
          var parts = range.replace(/bytes=/, "").split("-");
          var partialstart = parts[0];
          var partialend = parts[1];

          var start = parseInt(partialstart, 10);
          var end = partialend ? parseInt(partialend, 10) : total-1;
          var chunksize = (end-start)+1;
  //        console.log('RANGE: ' + start + ' - ' + end + ' = ' + chunksize);

          var file = fs.createReadStream(path, {start: start, end: end});
          res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });
          file.pipe(res);
        }
      }
    } else {
      log.info(`Video server: route ${route} not found`);
      res.setHeader("Content-Type", "text/html");
      res.writeHead(404);
      res.end(`Route ${route} not found`);
    }

}).listen(PORT);

console.log(`Video server is running on ${PORT}`)
