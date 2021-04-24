const fs = require('fs');

var { getYouTubeURL, getChunkHeader } = require('../libs/video.js');

async function publicRoute(req, res, item, quality, serverData) {

  var path = './videos/public/' + item;

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

module.exports = publicRoute;
