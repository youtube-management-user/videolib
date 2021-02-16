
const ejs = require("ejs");
const fs = require('fs');
const _  = require('lodash');

const { csv } = require('../libs/utils.js');

const orders = JSON.parse(fs.readFileSync('./txt/orders.json', 'UTF-8'));

const lectures = JSON.parse(fs.readFileSync('./txt/lectures.json', 'UTF-8'));

function shortDate(d) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function longDate(d) {
  const h = d.getHours() > 9? d.getHours(): '0' + d.getHours();
  const m = d.getMinutes() > 9? d.getMinutes(): '0' + d.getMinutes();
  return `${shortDate(d)} ${h}:${m}`;
}

function add(obj, key1, key2, elem) {
  if (!obj[key1]) obj[key1] = {};
  if (!obj[key1][key2]) obj[key1][key2] = [];
  obj[key1][key2].push(elem);
}

async function statsRoute(req, res) {

  const data = csv(fs.readFileSync('./logs/access-stats.csv', 'UTF-8'));
  console.log(data)

//  console.log(lectures.find(ll => ll.course == 1 && ll.number == 15))

  let ff = [];

  let viewsByUsers = {}, viewsByLectures = {}, lecturesByUrl = {};
  data.forEach(view => {

    if (view.url.match(/playlist\/\d+\/\d+\//)) {
      let [c, l] = view.url.split('playlist/')[1].split('/');
      const url = `${c}/${l}`;
      add(viewsByUsers, view.user, url, view.date);
      add(viewsByLectures, url, view.user, view.date);
      if (!lecturesByUrl[url]) {
        let lecture = lectures.find(ll => ll.course == parseInt(c) && ll.number == parseInt(l)) || { title: url };
        lecturesByUrl[url] = lecture;
      }
    }

//    add(viewsByUsers, view.user, view);
//    viewsByUsers[view.email].push(rec);
  })


//console.log(viewsByLectures)

  let usersDataByEmail = {};
  Object.keys(viewsByUsers).forEach(email => { usersDataByEmail[email] = orders.find(o => o.gmail == email); })
//  console.log(usersDataByEmail)

  let lecturesStat = Object.keys(viewsByLectures).map(url => {
    let obj = lecturesByUrl[url];
    obj.users = Object.keys(viewsByLectures[url]).map(email => {
      let views = viewsByLectures[url][email];
      let playingLength = ((new Date(views[views.length-1]).getTime() - new Date(views[0]).getTime())/60000);
      return { name: usersDataByEmail[email]? usersDataByEmail[email].name + ` <${email}>`: email, time: parseInt(playingLength), firstPlay: longDate(new Date(views[views.length-1])) };
    });
    obj.users = obj.users.filter(user => { return  user.time > 10 });
//    console.log(111, obj.users )
    return obj;
  })

//   let lecturesStat = _.uniq(data.map(rec => {
//     if (rec.url.match(/playlist\/\d+\/\d+\//)) {
//       const [c, l] = rec.url.split('playlist/')[1].split('/');
//       const url = `${c}/${l}`;
//       // if (!ff.user) {
//       //   ff.user = []
//       // }
//       // console.log(rec)
//
//       let lecture = lectures.find(ll => ll.course == parseInt(c) && ll.number == parseInt(l)) || { title: url };
//
// //      data.find(v => { v. })
//
//       lecture.users = Object.keys(viewsByLectures[url]);
//       return lecture;
//     } else {
//       return null
//     }
//   })).filter(d => d!=null);

//  console.log(viewsByLectures)

  // lecturesStat = lecturesStat.map(l => {
  //   let views  = data.filter(rec => rec.user == )
  // })

  const times = data.map(rec => new Date(rec.date).getTime());
//  console.log(Math.max(times))
  let period = shortDate(new Date(Math.min(...times))) + ' - ' + shortDate(new Date(Math.max(...times)));

//  let lecturesStat = [];
  // let lecturesStat = data.map(rec => {
  //   return rec;
  // })

  let usersByEmail = {};
  orders.forEach(order => usersByEmail[order.gmail] = order.nameo);

//  console.log(lectures)

//  const views

  // Статистика по лекциям
  // Название
  // Общее число просмотров за период ...
  // Просмотры по участникам:
  //
  // Статистика по участникам
  // Имя
  // Просмотрено лекций: ...


//  console.log(orders)

//  let period = '';
//  let lecturesStat = [];

  var contents = ejs.render(fs.readFileSync("./templates/stats.ejs", 'UTF-8'), { lecturesStat, period });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.writeHead(200);
  res.end(contents);
}

module.exports = statsRoute;
