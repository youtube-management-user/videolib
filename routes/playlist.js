
const cookie = require('cookie');
const ejs = require("ejs");
const fs = require('fs');

const { getOpenOrders } = require('../libs/utils.js');

const { urlGoogle } = require('../libs/google-utils.js');

const lectures = JSON.parse(fs.readFileSync('./txt/lectures.json', 'UTF-8'));

async function playlistRoute(req, res, course, number) {

  let openOrders = [];

  const userEmail = (req.user && req.user.email)? req.user.email: null;

  openOrders = await getOpenOrders(userEmail, {});
//  openOrders = await getOpenOrders(userEmail, { openById: [ 't33w2wn2b' ] });

  let openLectures = openOrders.map(order => { return lectures.find(l => l.courseLetters == order.course && l.number == order.number ) || order });

  let lectureData = {};

  lectureData = openLectures.find(l => l.course == course && l.number == number);

  //openLectures = openLectures.filter(l => l.course!=2 || l.number!=16);

  let showAuthorisationLink = true;
  //(course != 2 || number != 16);

  const googleLink = urlGoogle();

  var contents = ejs.render(fs.readFileSync("./templates/playlist.ejs", 'UTF-8'), { user: req.user, openLectures, googleLink, lectureData, showAuthorisationLink });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.writeHead(200);
  res.end(contents);
}

module.exports = playlistRoute;
