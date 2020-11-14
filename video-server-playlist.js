var http = require('http'),
    fs = require('fs'),
    util = require('util'),
    querystring = require('querystring'),
    urllib = require('url'),
    ejs = require("ejs"),
    glob = require("glob"),
    process = require("process");

const superagent = require('superagent');

const PORT = process.argv[2] || 9300;

const log = require('simple-node-logger').createSimpleFileLogger('project.log');

const { getYouTubeURL } = require('./libs');

// const playlist = {
//   'v1': { type: 'youtube', url: 'ZznD_uEN_hM', duration: 8.754 },
//   'v2': { type: 'local', path: 'videos/v2.mp4', duration: 170.859 },
//   'v3': { type: 'youtube', url: 'xzGaABufpRg', duration: 8.754 },
// }

const playlist = {
  'v1': { type: 'youtube', url: 'hU3y2ZXQUxA', duration: 8.754 },
  'v2': { type: 'remote',  url: 'http://velikanov.ru/play/acdc.mp4', duration: 170.859 },
  'v3': { type: 'youtube', url: '6ENZsgHNyoE', duration: 8.754 },
  'v4': { type: 'remote',  url: 'http://velikanov.ru/play/2cellos.mp4', duration: 170.859 },
  'v5': { type: 'youtube', url: 'eLj4rnboetA', duration: 8.754 },
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


      const path = await getYouTubeURL(playlist[filename].url);
      //  console.log(222, path)

        // const path = 'https://r2---sn-i5heen7z.googlevideo.com/videoplayback?expire=1605406565&ei=BTuwX_n8F4rQgAeC44rYAQ&ip=95.90.242.14&id=o-AEXbpzpHd8EM1PN8aJNNzpZnBW8TIcEZ1NklBw2PtCat&itag=18&source=youtube&requiressl=yes&mh=3g&mm=31%2C26&mn=sn-i5heen7z%2Csn-4g5e6nsz&ms=au%2Conr&mv=m&mvi=2&pl=23&initcwndbps=1316250&vprv=1&mime=video%2Fmp4&ns=PP3FhcN030jBW5tpNtVGHWQF&gir=yes&clen=825424&ratebypass=yes&dur=8.753&lmt=1600019644464084&mt=1605384883&fvip=2&c=WEB&txp=6210222&n=uP6VOz-pUMeLEKPDb&sparams=expire%2Cei%2Cip%2Cid%2Citag%2Csource%2Crequiressl%2Cvprv%2Cmime%2Cns%2Cgir%2Cclen%2Cratebypass%2Cdur%2Clmt&sig=AOq0QJ8wRQIgIzMBSXX6gRIwiZthfSe3sonAnP6Y2LzgbvjPDGHXan8CIQDT1TbkUKZjmdMexo9f80yHA6TsOUHklP8zDU-edsNVmQ%3D%3D&lsparams=mh%2Cmm%2Cmn%2Cms%2Cmv%2Cmvi%2Cpl%2Cinitcwndbps&lsig=AG3C_xAwRgIhAMc_zReBeH2kSCW6e8jNejXQHRBBGau3FNRxbl_jeKEmAiEAnPecLKXT1Gd8zuJT4zef15wC5d2xjQqMxZJr7yHvZSk%3D';

        const response = await superagent.get(path);
        //  console.log(333, response)
        //
        var total = response.headers["content-length"];
//        console.log(444, total)
//        var total = 2559700;

//        log.info('dur ' + response.headers["x-content-duration"])
//        path = "videos/sample.mp4"

//          console.log(333, path)

  //        const stream2 = fs.createWriteStream('stream.txt');

//          res.writeHead(206, { 'Content-Range': 'bytes ' + start + '-' + end + '/' + total, 'Accept-Ranges': 'bytes', 'Content-Length': chunksize, 'Content-Type': 'video/mp4' });

        if (req.headers['range']) {
          const chunkHeaders = getChunkHeader(req.headers.range, total);
          res.writeHead(206, chunkHeaders.headers);
          await superagent.get(path).set('Range', req.headers['range']).pipe(res);
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
