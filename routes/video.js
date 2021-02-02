
const fs = require('fs');
const superagent = require('superagent');

var { getYouTubeURL, getChunkHeader } = require('../libs/video.js');

function local(req, res, item, quality) {

  let path;
  if (!quality || quality == 'q1') {
    path = item.path;
  } else if (quality == 'q2') {
    path = item.medium;
  } else if (quality == 'q3') {
    path = item.low;
  }

  if (!path) {
    path = item.medium;
  }

  if (fs.existsSync(path)) {
    console.log(`Playing file ${path}`);
    var stat = fs.statSync(path);
    var total = stat.size;
    if (req.headers['range']) {
      var chunkHeaders = getChunkHeader(req.headers.range, total);
      res.writeHead(206, chunkHeaders.headers);
      var file = fs.createReadStream(path, {start: chunkHeaders.start, end: chunkHeaders.end});
      file.pipe(res);
    }
  } else {
    console.log(`Missing file ${path}`);
  }
}

function remote(req, res, item) {
  var path = item.url;
  superagent.head(path).then(response => {

    var total = response.headers["content-length"];

     if (req.headers['range']) {
       var chunkHeaders = getChunkHeader(req.headers.range, total);
       res.writeHead(206, chunkHeaders.headers);
       superagent.get(path).set('Range', req.headers['range']).pipe(res);
     }

  });
}

function youtube(req, res, item) {
  function onError() {
//      console.error(`Cannot retrieve video ${playlist[filename].url}, should be unlisted or public`);
    res.writeHead(404);
    res.end(`Cannot retrieve video`);
  }

  function onSuccess(videoData) {
    var path = videoData.video;
      console.log(`Got metadata about ${path}`);
    // const response = await superagent.head(path);
    // var total = response.headers["content-length"];
    var total = videoData.contentLength;
//      console.log(`Got file length ${total}`);

    if (req.headers['range']) {
      var chunkHeaders = getChunkHeader(req.headers.range, total);
      res.writeHead(206, chunkHeaders.headers);
      console.log(`Streaming with range ${req.headers['range']}`);
      superagent.get(path).set('Range', req.headers['range']).buffer(true).pipe(res);
    }
  }

  getYouTubeURL(item.url, onSuccess, onError);
}

async function videoRoute(req, res, item, quality, serverData) {

  if (serverData.connectionsCount > 24) {
    console.log(`Too many connections ${serverData.connectionsCount}`)
    res.writeHead(429);
    res.end(`Too many connections`);
  } else if (item.type == 'local') {
    local(req, res, item, quality);
  } else if (item.type == 'remote') {
    remote(req, res, item);
  } else if (item.type == 'youtube') {
    youtube(req, res, item)
  }

}

module.exports = videoRoute;
