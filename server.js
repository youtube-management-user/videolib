var http = require('http'),
    fs = require('fs'),
    util = require('util'),
    querystring = require('querystring'),
    urllib = require('url'),
    ejs = require("ejs"),
    glob = require("glob");

const PORT = 9000;

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

  console.log(`Access from ${req.headers["x-forwarded-for"]} for ${route}`);

  // if (referer && referer !='8608b0611412.ngrok.io' && referer !='localhost') {
  //   console.log(`Hotlinking attempt from ${referer}`);
  //   res.writeHead(403);
  //   res.end("");
  // }
  // else {

    if (route == 'play' && filename!='') {
      const contents = ejs.render(fs.readFileSync("./templates/play.ejs", 'UTF-8'), { filename: filename + ".mp4" });
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      res.end(contents);
    } else if (route == 'play' && filename=='') {
      const files = glob.sync("./videos/*.mp4").map(file => { return file.split('/')[2].replace('.mp4', '') });
      console.log(files)
      const contents = ejs.render(fs.readFileSync("./templates/index.ejs", 'UTF-8'), { files: files });
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      res.end(contents);
    }
    else if (route == 'video') {
      var path = "videos/" + filename;
      if (!fs.existsSync(path)) {
        console.log(`File ${filename} not found`);
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
      console.log(`Route ${route} not found`);
      res.setHeader("Content-Type", "text/html");
      res.writeHead(404);
      res.end(`Route ${route} not found`);
    }

}).listen(PORT);

console.log(`Server is running on ${PORT}`)
