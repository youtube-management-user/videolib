
const { urlGoogle, getAccessToken, getGoogleUserInfo } = require('../libs/google-utils.js');
var cookie = require('cookie');
querystring = require('querystring');

async function googleAuthRoute(req, res, query) {

  let redirect = null;
  try {
    redirect = JSON.parse(querystring.parse(req.url.split('?')[1]).state).redirect;
  } catch(ex) {
  }

//  if (redirect.match(/\/playlist\/\d+\/\d+\//))

//  console.log(222, query)
  if (query.code) {
    const resp = await getAccessToken({ code: query.code});
//    console.log(111, resp)
    if (resp.access_token == 400 || resp.access_token == 401) {
      res.setHeader("Content-Type", "text/html");
      res.writeHead(200);
      const googleLink = urlGoogle();
      res.end(`Link expired, please loging again: <a href="${googleLink}">Login</a>`);
    } else {
      const userData = await getGoogleUserInfo(resp.access_token);
      console.log('reg', resp.access_token, resp.refresh_token)
      req.user = userData;

      res.setHeader("Set-Cookie", [cookie.serialize('token', resp.access_token, {
  //          httpOnly: true,
        path:'/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      }),

      cookie.serialize('rtoken', resp.refresh_token, {
  //          httpOnly: true,
        path:'/',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      })]);

      res.statusCode = 302;
      res.setHeader('Location', redirect || '/playlist/');
      res.end();
    }
  }

}

module.exports = googleAuthRoute;
