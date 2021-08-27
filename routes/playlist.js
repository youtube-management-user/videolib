
const cookie = require('cookie');
const ejs = require("ejs");
const fs = require('fs');
const _ = require('lodash');

const { getOpenOrders, convertTextFiles } = require('../libs/utils.js');

const { urlGoogle } = require('../libs/google-utils.js');

async function playlistRoute(req, res, course, number, playlist) {

  const lecturesPath = './txt/lectures.json';
  if (!fs.existsSync(lecturesPath)) {
    convertTextFiles();
  }

  const lectures = JSON.parse(fs.readFileSync(lecturesPath, 'UTF-8'));

  let openOrders = [];

  const userEmail = (req.user && req.user.email)? req.user.email: null;

  openOrders = await getOpenOrders(userEmail);

  let openLectures = _.uniq(openOrders.map(order => {
    let lecture = lectures.find(l => l.courseLetters == order.course && l.number == order.number )
    const res = lecture || order
    res.speedChangeAllowed = parseInt(order.v) === 1;
    return res;
  }));

  let lectureData = {};

  if (req.user && req.user.email) {
    lectureData = openLectures.find(l => l.course == course && l.number == number);
  }

  let pageTitle = null;
  const currentLectureDataForTitle = openLectures.find(l => l.course == course && l.number == number);
  if (currentLectureDataForTitle) {
    pageTitle = `${currentLectureDataForTitle.courseHeader}.${currentLectureDataForTitle.number}. ${currentLectureDataForTitle.title}`;
  }

  let playlistItem;

  if (lectureData && lectureData.video) {
    playlistItem = playlist[lectureData.video]
    if (fs.existsSync(`./templates/img/${lectureData.video}.png`)) {
      lectureData.poster = `/img/${lectureData.video}.png`;
      console.log(`Found poster ${lectureData.video}.png`)
    } else {
      console.log(`Not found poster ${lectureData.video}.png`)
    }

    playlistItem.amount = 0;
    if (playlistItem.low) playlistItem.amount++;
    if (playlistItem.medium) playlistItem.amount++;
    if (playlistItem.path) playlistItem.amount++;

  }

  let showAuthorisationLink = true;

  const googleLink = urlGoogle({ redirect: req.url });

  console.log(111, lectureData, playlistItem)

  var contents = ejs.render(fs.readFileSync("./templates/playlist.ejs", 'UTF-8'), { user: req.user, openLectures, playlistItem, googleLink, lectureData, pageTitle, showAuthorisationLink });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.writeHead(200);
  res.end(contents);
}

module.exports = playlistRoute;
