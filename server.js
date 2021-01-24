var http = require('http'),
    querystring = require('querystring'),
    fs = require('fs'),
    process = require("process");

var PORT = process.argv[2] || 9300;

var log = require('simple-node-logger').createSimpleFileLogger('project2.log');

const { buildPlaylist, reloadPaidFile, syncPaidFileStatuses } = require('./libs/utils.js')

const playlistRoute     = require('./routes/playlist.js');
const videoRoute        = require('./routes/video.js');
const logoutRoute       = require('./routes/logout.js');
const googleAuthRoute   = require('./routes/google-auth.js');
const staticsRoute      = require('./routes/statics.js');
const notFoundRoute     = require('./routes/not-found.js');
const initAuth          = require('./routes/auth.js');

let playlist = buildPlaylist();

setInterval(reloadPaidFile, 1000 * 60 * 5);

setInterval(syncPaidFileStatuses, 1000* 60 * 5);

http.createServer(async function (req, res) {

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

  if (route == 'playlist' && req.user && req.user.email) {
    log.info(`Access to ${route} (${req.url}) from user ${req.user.email}`);
    const content = fs.readFileSync('./logs/access-stats.csv', 'UTF-8');
    fs.writeFileSync('./logs/access-stats.csv', content + `${new Date().toLocaleString().replace(',', ' ')},${req.user.email},${req.url}\r\n`, 'UTF-8');
  }

  if (route == 'css') {
    staticsRoute(req, res, token[0]);
  } else if (route == 'test') {
    testRoute(req, res);
  } else if (route == 'playlist') {
    playlistRoute(req, res, token[0], token[1]);
  } else if (route == 'logout') {
    logoutRoute(req, res);
  } else if (route == 'google-auth') {
    googleAuthRoute(req, res, query);
  } else if (route == 'video' && playlist[token[0]]) {
    videoRoute(req, res, playlist[token[0]]);
  } else {
    notFoundRoute(req, res, route);
  }

}).listen(PORT);

console.log(`Server is running on ${PORT}`)
