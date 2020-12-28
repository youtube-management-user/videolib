
const { urlGoogle, getAccessTokenFromCode, getGoogleUserInfo } = require('../libs/google-utils.js');
var cookie = require('cookie');

async function googleAuthRoute(req, res, query) {

  if (query.code) {
    const token = await getAccessTokenFromCode(query.code)
    if (token == 400 || token == 401) {
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      const googleLink = urlGoogle();
      res.end(`Link expired, please loging again: <a href="${googleLink}">Login</a>`);
    } else {
      const userData = await getGoogleUserInfo(token);
      req.user = userData;
      res.setHeader("Set-Cookie", cookie.serialize('token', String(token), {
  //          httpOnly: true,
        path:'/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      }));
      res.statusCode = 302;
      res.setHeader('Location', '/playlist/');
      res.end();
    }
  }

}

module.exports = googleAuthRoute;
