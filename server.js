var http = require('http'),
    querystring = require('querystring'),
    fs = require('fs'),
    process = require("process");

var PORT = process.argv[2] || 9300;

var log = require('simple-node-logger').createSimpleFileLogger('./logs/project2.log');

const { buildPlaylist, reloadPaidFile, syncPaidFileStatuses, csvLogger, convertTextFiles } = require('./libs/utils.js')

const playlistRoute     = require('./routes/playlist.js');
const videoRoute        = require('./routes/video.js');
const logoutRoute       = require('./routes/logout.js');
const googleAuthRoute   = require('./routes/google-auth.js');
const cssRoute          = require('./routes/css.js');
const imgRoute          = require('./routes/img.js');
const notFoundRoute     = require('./routes/not-found.js');
const healthRoute       = require('./routes/health.js');

const initAuth          = require('./routes/auth.js');

const playlist = buildPlaylist();

setInterval(convertTextFiles, 1000* 60 * 5);

setInterval(syncPaidFileStatuses, 1000* 60 * 5);

let connectionsCount = 0;

http.createServer(async function (req, res) {

  connectionsCount++;

  function reduceConn() { connectionsCount--; };

  res.on('finish', reduceConn);
  res.on('end', reduceConn);

//  console.log({connectionsCount})

//  console.log('req', req.url)

  var path = req.url.split('/');
  var [ none, route, ...token ] = path;
  var query;
  if (token[token.length-1] && token[token.length-1].indexOf('=')>=0) {
    query = querystring.parse(req.url.split('?')[1])
  }

  log.info(`Video server: access from ${req.headers["x-forwarded-for"]} for ${route}, ${req.url}`);

  if (route == 'playlist' || route == 'video') {
    await initAuth(req, res);
  }

  if ((route == 'playlist' || route == 'video') && req.user && req.user.email) {
    log.info(`Access to ${route} (${req.url}) from user ${req.user.email}`);
    const content = fs.readFileSync('./logs/access-stats.csv', 'UTF-8');
    let logUrl = req.url;//.replace(/\/[a-z9-9]+$/, '');
    fs.writeFileSync('./logs/access-stats.csv', content + `${new Date().toLocaleString().replace(',', ' ')},${req.user.email},${logUrl}\r\n`, 'UTF-8');
  }

  let serverData = { connectionsCount };

  if (route == 'css') {
    cssRoute(req, res, token[0]);
  } else if (route == 'img') {
    imgRoute(req, res, token[0]);
  } else if (route == 'test') {
    testRoute(req, res);
  } else if (route == 'health') {
    healthRoute(req, res, serverData);
  } else if (route == 'playlist') {
    playlistRoute(req, res, token[0], token[1], playlist);
  } else if (route == 'logout') {
    logoutRoute(req, res);
  } else if (route == 'google-auth') {
    googleAuthRoute(req, res, query);
  } else if (route == 'video' && playlist[token[0]]) {
    videoRoute(req, res, playlist[token[0]], token[1], serverData);
  } else {
    notFoundRoute(req, res, route);
  }

}).listen(PORT);

console.log(`Server is running on ${PORT}`)
