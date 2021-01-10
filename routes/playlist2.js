
const cookie = require('cookie');
const ejs = require("ejs");
const fs = require('fs');
const _ = require('lodash');

const { csv, buildPlaylist, parsePaidUsersFile } = require('../libs/utils.js');

async function playlistRoute(req, res) {

  const filename = (req.currentOrder && req.currentOrder.id)? req.currentOrder.id: null;

  let lectureData = {};
  try {
    var lectures = fs.readFileSync("./txt/lectures.txt", 'UTF-8').split(/\n/).filter(l => l!='').map(l => { const [key, value] =  l.split('|'); let obj = {}; obj[key] = value; return obj; });
    let lecturesObj = {};
    lectures.forEach(l => { lectures[Object.keys(l)[0]] = Object.values(l)[0] })
    let course = req.currentOrder.course;
    const lecturesMapping = [ 'ФИ', 'ЯК', 'АЭ', 'ИО', 'HM' ];
    course = lecturesMapping.indexOf(course)+1;
    const key = '' + course + '-' + (req.currentOrder.number.length == 1? '0' + req.currentOrder.number: req.currentOrder.number);
    lectureData = { title: lectures[key] }
  } catch(ex) { console.log(ex) }

  var contents = ejs.render(fs.readFileSync("./templates/playlist.ejs", 'UTF-8'), { user: {}, googleLink: {}, filename, lectureData });

  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  res.end(contents);
}

module.exports = playlistRoute;
