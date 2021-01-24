
var cookie = require('cookie');

const { urlGoogle, getGoogleAccountFromCode, getAccessToken, getGoogleUserInfo, parseCookies, setGoogleConfig } = require('../libs/google-utils.js');

async function initAuth(req, res) {

  setGoogleConfig({domain: req.headers.host});

  var cookies = cookie.parse(req.headers.cookie || '');

  if (cookies.token!='') {
    let data = await getGoogleUserInfo(cookies.token);
    if (data.code == 401) {
      console.log('Token is expired');
      if (cookies.rtoken) {
        try {
          const resp = await getAccessToken({ refresh_token: cookies.rtoken});
          data = await getGoogleUserInfo(resp.access_token);

          if (data.email) {
            console.log('Refreshing token');
            res.setHeader("Set-Cookie", cookie.serialize('token', resp.access_token, {
        //          httpOnly: true,
              path:'/',
              maxAge: 60 * 60 * 24 * 7 // 1 week
            }))
            req.user = data;
          } else {
            console.log('Fail to refresh');
            req.user = null;
          }

        } catch(ex) {
          console.log('Fail to refresh', ex);
          req.user = null;
        }
      }
    } else {
      console.log('Authorized', req.url)
      req.user = data;
    }
  }

}

module.exports = initAuth;
