
const cookie = require('cookie');
const ejs = require("ejs");
const fs = require('fs');
const _ = require('lodash');

const { csv, buildPlaylist, parsePaidUsersFile } = require('../libs/utils.js');

async function playlistRoute(req, res) {

  const filename = (req.currentOrder && req.currentOrder.id)? req.currentOrder.id: null;

  let lectureData = {};
  try {
    let { course, number } = req.currentOrder;
    const lecturesMapping = [ 'ФИ', 'ЯК', 'АЭ', 'ИО', 'HM' ];

    const lecturesHeadersMapping = [ 'Философия искусства', 'Языки культуры', 'Анаморфическая энциклопедия', 'Идеи и образы', 'Homo mutabilis' ];
    course = lecturesMapping.indexOf(course)+1;
//    number = number.length == 1? '0'+number: ''+number;
//    console.log(111, course, number)
    var data = fs.readFileSync(`./txt/${course}/${number}.txt`, 'UTF-8').split(/\r\n\r\n|\n\n/).filter(l => l!='');
    data.forEach(part => {
      let [key, ...value] = part.split(/\r\n|\n/);
      key = key.replace(/[^a-zA-Z+]/, '');
      value = value.filter(v => v!='');
      if (value.length == 1) value = value[0];
      lectureData[key] = value;
    });
    lectureData.courseHeader = lecturesHeadersMapping[course-1];
    lectureData.courseNum = course+13;
    lectureData.number = number;
    if (lectureData.literature!='') {
      lectureData.literature = lectureData.literature.map(l => l.split('|'));
    }
    if (lectureData.movies!='') {
      lectureData.movies = lectureData.movies.map(l => l.split('|'));
    }
//    console.log(lectureData)
    // let lecturesObj = {};
    // lectures.forEach(l => { lecturesObj[Object.keys(l)[0]] = Object.values(l)[0] })
    // let course = req.currentOrder.course;
    // course = lecturesMapping.indexOf(course)+1;
    // const key = '' + course + '-' + (req.currentOrder.number.length == 1? '0' + req.currentOrder.number: req.currentOrder.number);
    // lectureData = { title: lecturesObj[key] }
  } catch(ex) { console.log(ex) }

  var contents = ejs.render(fs.readFileSync("./templates/playlist3.ejs", 'UTF-8'), { user: {}, googleLink: {}, filename, lectureData });

  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  res.end(contents);
}

module.exports = playlistRoute;
