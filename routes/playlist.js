
const cookie = require('cookie');
const ejs = require("ejs");
const fs = require('fs');

const { urlGoogle, getGoogleAccountFromCode, getAccessTokenFromCode, getGoogleUserInfo, parseCookies } = require('../libs/google-utils.js');

async function playlistRoute(req, res) {
  var cookies = cookie.parse(req.headers.cookie || '');

  if (cookies.token) {
    try {
      const userData = await getGoogleUserInfo(cookies.token);
      req.user = userData;
    } catch(ex) {

    }
  }

  const googleLink = urlGoogle();
  var contents = ejs.render(fs.readFileSync("./templates/playlist.ejs", 'UTF-8'), { googleLink, user: req.user });
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  res.end(contents);
}

module.exports = playlistRoute;
