
const cookie = require('cookie');
const ejs = require("ejs");
const fs = require('fs');
const _ = require('lodash');

const { parse } = require('fecha');

const { csv, buildPlaylist } = require('../libs/utils.js');

const { urlGoogle, getGoogleAccountFromCode, getAccessTokenFromCode, getGoogleUserInfo, parseCookies } = require('../libs/google-utils.js');

async function playlistRoute(req, res) {
  var cookies = cookie.parse(req.headers.cookie || '');

  let lectures = [], playlist = buildPlaylist();

  console.log(playlist)

  if (cookies.token) {
    try {
      const userData = await getGoogleUserInfo(cookies.token);
      req.user = userData;

      const coursesLatinMapping = { 'ФИ': 'FI', 'ЯК' : 'YK', 'АЭ': 'AE', 'ИО': 'IO', 'HM': 'HM' };

      let paidUsers = csv(fs.readFileSync('./txt/paid_h.txt', 'UTF-8'));

      paidUsers = paidUsers.map(rec => { rec.begin = parse(rec.begin.split(' ')[0], 'DD.M.YYYY'); rec.end = parse(rec.end, 'DD.MM.YYYY'); return rec;  })

      const perimissions = paidUsers.filter(rec => rec.gmail == userData.email);

      const openLectures = perimissions.filter(perm => {
        return (new Date(perm.begin) <= new Date() && new Date() <= new Date(perm.end));
      })

      lectures = openLectures.map(l => {
        const name = `${l.course} - ${l.number}`;
        const courseLatin = coursesLatinMapping[l.course];
        return { name, id: `${courseLatin}-${l.number}` }
      })

    } catch(ex) {
      console.log(ex)
    }
  }

  const googleLink = urlGoogle();
  var contents = ejs.render(fs.readFileSync("./templates/playlist.ejs", 'UTF-8'), { googleLink, user: req.user, lectures });
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  res.end(contents);
}

module.exports = playlistRoute;
