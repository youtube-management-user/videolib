
const cookie = require('cookie');
const ejs = require("ejs");
const fs = require('fs');
const _ = require('lodash');

const { getOpenOrders } = require('../libs/utils.js');

const { urlGoogle } = require('../libs/google-utils.js');

const lectures = JSON.parse(fs.readFileSync('./txt/lectures.json', 'UTF-8'));

async function playlistRoute(req, res, course, number, playlist) {

  let openOrders = [];

  const userEmail = (req.user && req.user.email)? req.user.email: null;

  openOrders = await getOpenOrders(userEmail);

  let openLectures = _.uniq(openOrders.map(order => { return lectures.find(l => l.courseLetters == order.course && l.number == order.number ) || order }));

  let lectureData = {};

  if (req.user && req.user.email) {
    lectureData = openLectures.find(l => l.course == course && l.number == number);
  }

  let pageTitle = null;
  const currentLectureDataForTitle = openLectures.find(l => l.course == course && l.number == number);
  if (currentLectureDataForTitle) {
    pageTitle = `${currentLectureDataForTitle.courseHeader}.${currentLectureDataForTitle.number}. ${currentLectureDataForTitle.title}`;
  }

  const playlistItem = playlist[lectureData.video]
  console.log(444, lectureData)

  let showAuthorisationLink = true;

  const googleLink = urlGoogle({ redirect: req.url });

  var contents = ejs.render(fs.readFileSync("./templates/playlist.ejs", 'UTF-8'), { user: req.user, openLectures, playlistItem, googleLink, lectureData, pageTitle, showAuthorisationLink });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.writeHead(200);
  res.end(contents);
}

module.exports = playlistRoute;
