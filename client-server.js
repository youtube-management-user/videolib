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

  log.info(`Client server: access from ${req.headers["x-forwarded-for"]} for ${route}`);

    if (route == 'play' && filename!='') {
      const contents = ejs.render(fs.readFileSync("./templates/play.ejs", 'UTF-8'), { filename: filename + ".mp4" });
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      res.end(contents);
    } else if (route == 'play' && filename=='') {
//      const files = glob.sync("./videos/*.mp4").map(file => { return file.split('/')[2].replace('.mp4', '') });
      const contents = ejs.render(fs.readFileSync("./templates/index2.ejs", 'UTF-8'));
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      res.end(contents);
    } else {
      log.info(`Client server: route ${route} is not found`);
      res.setHeader("Content-Type", "text/html");
      res.writeHead(404);
      res.end(`Route ${route} not found`);
    }

}).listen(PORT);

console.log(`Client server is running on ${PORT}`)
