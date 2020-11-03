var http = require('http'),
    fs = require('fs'),
    util = require('util'),
    querystring = require('querystring'),
    urllib = require('url'),
    ejs = require("ejs"),
    glob = require("glob");
//    https = require("https");
    // var htmlparser = require("htmlparser2");
    // var router = express.Router();

const superagent = require('superagent');
var JSSoup = require('jssoup').default;

const PORT = 9000;

const log = require('simple-node-logger').createSimpleFileLogger('project.log');

async function getYouTubeURL(filename, log) {
  const _ = require('lodash')
  if (!filename.match(/^[a-zA-Z0-9_-]{6,11}$/)) {
    throw(`Incorrect YouTube video ${filename}`);
  }
  const response = await superagent.get('https://www.youtube.com/watch?v=' + filename);

  var soup = new JSSoup(response.text);
  let scriptElements = soup.findAll("script");

  let scriptElementsFiltered = scriptElements.filter(el => { return el.text.indexOf('videoplayback') >= 0 });

  let window = {}, document = {};
  eval((scriptElementsFiltered[0].text));

  let video = JSON.parse(_.get(ytplayer, 'config.args.player_response')).streamingData.formats[0].url;

  if (!video) {
    throw('Empty response from video');
  }

  return video;
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

  log.info(`Client server: access from ${req.headers["x-forwarded-for"]} for ${route}`);

  if (route == 'play' && filename!='') {

    let YouTubeCache = {};
    try {
      fs.accessSync('./YouTubeCache.json', fs.constants.R_OK | fs.constants.W_OK);
      YouTubeCache = require('./YouTubeCache.json');
    } catch (err) {
      log.error(`Cannot access cache, will create a new file`);
    }

    res.setHeader("Content-Type", "text/html");
    res.writeHead(200);

//    console.log(222, filename, req.url);

    if (!filename.match(/^[a-zA-Z0-9_-]{6,11}$/)) {
      res.end(`Video ${filename} is not the YouTube video`);
    } else {

      let videoFileURL = '';
      if (YouTubeCache[filename] && YouTubeCache[filename]!=='') {
        log.info(`There is a cached version for ${filename}`);
      } else {
        log.info(`There is no cached version for ${filename}, trying to get it from the YouTube`);
        try {
          YouTubeCache[filename] = await getYouTubeURL(filename, log);
        }
        catch (ex) {
          log.error(`There is no video file URL, video private or YouTube changed format 😕`);
          res.end(`Video ${filename} cannot be played, video is private or YouTube changed its format`);
        }
      }

      videoFileURL = YouTubeCache[filename];

      const contents = ejs.render(fs.readFileSync("./templates/play.ejs", 'UTF-8'), { video: videoFileURL });
      res.end(contents);
      fs.writeFileSync('YouTubeCache.json', JSON.stringify(YouTubeCache));

    }

  }
  else if (route == 'play' && filename=='') {
    log.info(`Client server: route ${route} is not found`);
    res.end(`Route ${route} not found`);
  }

}).listen(PORT);

console.log(`Client server is running on ${PORT}`)
