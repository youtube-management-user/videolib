var http = require('http'),
    fs = require('fs'),
    util = require('util'),
    querystring = require('querystring'),
    urllib = require('url'),
    ejs = require("ejs"),
    process = require("process");

const superagent = require('superagent');

const PORT = process.argv[2] || 9300;

const log = require('simple-node-logger').createSimpleFileLogger('project2.log');

const getYouTubeURL = require('./libs').getYouTubeURL;

// const playlist = {
//   'v1': { type: 'youtube', url: 'ZznD_uEN_hM', duration: 8.754 },
//   'v2': { type: 'local', path: 'videos/v2.mp4', duration: 170.859 },
//   'v3': { type: 'youtube', url: 'xzGaABufpRg', duration: 8.754 },
// }

const playlist = {
  // 'v1': { type: 'youtube', url: 'P8gZvHldvcw' },
  // 'v2': { type: 'remote',  url: 'http://velikanov.ru/play/acdc.mp4' },
  'v1': { type: 'youtube', url: 'dVHC0ZG7ckg' },
  'v2': { type: 'remote',  url: 'http://velikanov.ru/play/2cellos.mp4' },
  'v3': { type: 'youtube', url: 'W_dg_06cDiM' },
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
  if (filename && filename.indexOf('?')>0) {
    query = querystring.parse(filename.split('?')[1]);
    filename = filename.split('?')[0];
  }
  const referer = urllib.parse(req.headers.referer || '').hostname;

  log.info(`Video server: access from ${req.headers["x-forwarded-for"]} for ${route}, ${req.url}`);

  if (route == 'playlist') {
    const contents = ejs.render(fs.readFileSync("./templates/playlist.ejs", 'UTF-8'));
    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);
    res.end(contents);
  } else if (route == 'video') {

      if (playlist[filename].type == 'local') {
        var path = playlist[filename].path;

        if (fs.existsSync(path)) {
          var stat = fs.statSync(path);
          var total = stat.size;
          if (req.headers['range']) {
            const chunkHeaders = getChunkHeader(req.headers.range, total);
            res.writeHead(206, chunkHeaders.headers);
            const file = fs.createReadStream(path, {start: chunkHeaders.start, end: chunkHeaders.end});
            file.pipe(res);
          }
        } else {
          log.info(`Video server: file ${filename} not found at ${playlist[filename].path}`);
          res.setHeader("Content-Type", "text/html");
          res.writeHead(404);
          res.end(`File ${filename} is not found`);
        }
      } else if (playlist[filename].type == 'remote') {

        const path = playlist[filename].url;
        const response = await superagent.head(path);

        var total = response.headers["content-length"];

         if (req.headers['range']) {
           const chunkHeaders = getChunkHeader(req.headers.range, total);
           res.writeHead(206, chunkHeaders.headers);
           await superagent.get(path).set('Range', req.headers['range']).pipe(res);
         }

      } else if (playlist[filename].type == 'youtube') {

        try {
          const videoData = await getYouTubeURL(playlist[filename].url);
          const path = videoData.video;
          log.info(`Got metadata about ${playlist[filename].url}`);
          // const response = await superagent.head(path);
          // var total = response.headers["content-length"];
          var total = videoData.contentLength;
          log.info(`Got file length ${total}`);

          if (req.headers['range']) {
            const chunkHeaders = getChunkHeader(req.headers.range, total);
            res.writeHead(206, chunkHeaders.headers);
            log.info(`Streaming with range ${req.headers['range']}`);
            await superagent.get(path).set('Range', req.headers['range']).buffer(true).pipe(res);
          }
        }
        catch(ex) {
          log.error(`Cannot retrieve video ${playlist[filename].url}, should be unlisted or public (${ex})`);
          res.writeHead(404);
          res.end(`Cannot retrieve video`);
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

console.log(`Video server is running on ${PORT}`)
