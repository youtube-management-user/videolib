var http = require('http'),
    fs = require('fs'),
    util = require('util'),
    querystring = require('querystring'),
    urllib = require('url'),
    ejs = require("ejs"),
    process = require("process");

var PORT = process.argv[2] || 9300;

var log = require('simple-node-logger').createSimpleFileLogger('project2.log');

const playlistRoute     = require('./routes/playlist.js');

const playlist = {
  '16c': { type: 'local', path: 'videos/sample.mp4' },
  'v2': { type: 'local', path: 'videos/v2.mp4' }
}

function getChunkHeader(range, total) {
  var parts = range.replace(/bytes=/, "").split("-");
  var partialstart = parts[0];
  var partialend = parts[1];

  var start = parseInt(partialstart, 10);
  var end = partialend ? parseInt(partialend, 10) : total-1;
  var chunksize = (end-start)+1;
  console.log(range, partialend, 'RANGE: ' + start + ' - ' + end + ' = ' + chunksize);
  return { headers: { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' }, start: start, end: end }
}

http.createServer(async function (req, res) {

  var path = req.url.split('/');
  var route = path[1];
  var filename = path[2];
  var query = '';
  if (filename && filename.indexOf('?')>=0) {
    query = querystring.parse(filename.split('?')[1]);
    filename = filename.split('?')[0];
  }
  var referer = urllib.parse(req.headers.referer || '').hostname;

  log.info(`Video server: access from ${req.headers["x-forwarded-for"]} for ${route}, ${req.url}`);

  if (route == 'playlist') {
    var contents = ejs.render(fs.readFileSync("./templates/playlist-simple.ejs", 'UTF-8'), { filename });
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(contents);
  }  else if (route == 'video') {

      if (!playlist[filename]) {
        log.info(`Video server: file ${filename} not found`);
        res.setHeader("Content-Type", "text/html");
        res.writeHead(404);
        res.end(`File ${filename} is not found`);
      } else if (playlist[filename].type == 'local') {
        var path = playlist[filename].path;

        if (fs.existsSync(path)) {
          var stat = fs.statSync(path);
          var total = stat.size;
          if (req.headers['range']) {
            var chunkHeaders = getChunkHeader(req.headers.range, total);
            res.writeHead(206, chunkHeaders.headers);
            var file = fs.createReadStream(path, {start: chunkHeaders.start, end: chunkHeaders.end});
            file.pipe(res);
          }
        } else {
          log.info(`Video server: file ${filename} not found at ${playlist[filename].path}`);
          res.setHeader("Content-Type", "text/html");
          res.writeHead(404);
          res.end(`File ${filename} is not found`);
        }

      } else {
        log.info(`Unknown file type ${filename}`);
        res.setHeader("Content-Type", "text/html");
        res.writeHead(404);
        res.end(`Unknown file type ${filename}`);
      }

    } else {
      log.info(`Video server: route ${route} not found`);
      res.setHeader("Content-Type", "text/html");
      res.writeHead(404);
      res.end(`Route ${route} not found`);
    }

}).listen(PORT);

console.log(`Server is running on ${PORT}`)
