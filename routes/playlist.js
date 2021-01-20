
const cookie = require('cookie');
const ejs = require("ejs");
const fs = require('fs');

const { getOpenOrders } = require('../libs/utils.js');

const { urlGoogle } = require('../libs/google-utils.js');

const lectures = JSON.parse(fs.readFileSync('./txt/lectures.json', 'UTF-8'));

async function playlistRoute(req, res, course, number) {

  let openOrders;

  if (req.user && req.user.email) {
    openOrders = await getOpenOrders(req.user.email);
  }

  let openLectures = openOrders.map(order => { return lectures.find(l => l.courseLetters == order.course && l.number == order.number ) });

  let lectureData = {};
  lectureData = openLectures.find(l => l.course == course && l.number == number);

  const googleLink = urlGoogle();

  var contents = ejs.render(fs.readFileSync("./templates/playlist.ejs", 'UTF-8'), { user: req.user, openLectures, googleLink, lectureData });

  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  res.end(contents);
}

module.exports = playlistRoute;
