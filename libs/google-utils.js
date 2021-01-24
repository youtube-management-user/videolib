const googleapis = require('googleapis');
const axios = require('axios');

const google = googleapis.google;

let googleConfig;

const setGoogleConfig = function(config) {
  googleConfig = {
    clientId: '278965369608-ej1da7f5p57a8r5evlljr2kh4vpo436n.apps.googleusercontent.com',
    clientSecret: 'h2HonRzO3ivPabWcancnJ-yG',
    redirect: 'http://' + (config.domain || 'localhost:9300') + '/google-auth/'
  }
};

const defaultScope = [
  'https://www.googleapis.com/auth/plus.me',
  'https://www.googleapis.com/auth/userinfo.email',
];

/*************/
/** HELPERS **/
/*************/

function createConnection() {
  return new google.auth.OAuth2(
    googleConfig.clientId,
    googleConfig.clientSecret,
    googleConfig.redirect
  );
}

function getConnectionUrl(auth, params) {
  return auth.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: defaultScope,
    state: JSON.stringify(params)
  });
}

function getGooglePlusApi(auth) {
  return google.plus({ version: 'v1', auth });
}

/**********/
/** MAIN **/
/**********/

/**
 * Part 1: Create a Google URL and send to the client to log in the user.
 */
function urlGoogle(params) {
  const auth = createConnection();
  const url = getConnectionUrl(auth, params);
  return url;
}

/**
 * Part 2: Take the "code" parameter which Google gives us once when the user logs in, then get the user's email and id.
 */
async function getGoogleAccountFromCode(code) {
  const auth = createConnection();
  const data = await auth.getToken(code);
  const tokens = data.tokens;
  auth.setCredentials(tokens);
  const plus = getGooglePlusApi(auth);
  const me = await plus.people.get({ userId: 'me' });
  const userGoogleId = me.data.id;
  const userGoogleEmail = me.data.emails && me.data.emails.length && me.data.emails[0].value;
  return {
    id: userGoogleId,
    email: userGoogleEmail,
    tokens: tokens,
  };
}

async function getAccessToken(param) {
  try {
    let payload = {
      client_id: googleConfig.clientId,
      client_secret: googleConfig.clientSecret,
      redirect_uri: googleConfig.redirect,
    }
    if (param.code) {
      payload.grant_type = 'authorization_code';
      payload.code = param.code;
    }
    if (param.refresh_token) {
      payload.grant_type = 'refresh_token';
      payload.refresh_token = param.refresh_token;
    }
    const { data } = await axios({
      url: `https://oauth2.googleapis.com/token`,
      method: 'post',
      data: payload,
    });
//    console.log(data); // { access_token, expires_in, token_type, refresh_token }
    return data;
  } catch(ex) {
    console.log(ex.response);
    return ex;
  }
};

async function getGoogleUserInfo(access_token) {
  try {
    const { data } = await axios({
      url: 'https://www.googleapis.com/oauth2/v2/userinfo',
      method: 'get',
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });
  //  console.log(data); // { id, email, given_name, family_name }
    return data;
  } catch(ex) {
    return ex.response.data.error;
  }
};

function parseCookies (request) {
    var list = {},
        rc = request.headers.cookie;

    rc && rc.split(';').forEach(function( cookie ) {
        var parts = cookie.split('=');
        list[parts.shift().trim()] = decodeURI(parts.join('='));
    });

    return list;
}

module.exports = { urlGoogle, getGoogleAccountFromCode, getAccessToken, getGoogleUserInfo, parseCookies, setGoogleConfig }
