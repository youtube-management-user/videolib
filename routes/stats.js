
const ejs = require("ejs");
const fs = require('fs');
const _  = require('lodash');

const { csv } = require('../libs/utils.js');

const orders = JSON.parse(fs.readFileSync('./txt/orders.json', 'UTF-8'));

const lectures = JSON.parse(fs.readFileSync('./txt/lectures.json', 'UTF-8'));

function pad(n) {
  return n > 9? n: '0' + n;
}

function shortDate(d) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
}

function longDate(d) {
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  return `${shortDate(d)} ${h}:${m}`;
}

function shortDate2(d) {
  const h = pad(d.getHours());
  const m = pad(d.getMinutes());
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${d.getDate()}`;
}

function add(obj, key1, key2, elem) {
  if (!obj[key1]) obj[key1] = {};
  if (!obj[key1][key2]) obj[key1][key2] = [];
  obj[key1][key2].push(elem);
}

function getLecturesStats(data) {
  let viewsByUsers = {}, viewsByLectures = {}, lecturesByUrl = {};
  data.forEach(view => {

    if (view.url) {
      if (view.url.match(/playlist\/\d+\/\d+\//)) {
        let [c, l] = view.url.split('playlist/')[1].split('/');
        const url = `${parseInt(c)}/${parseInt(l)}`;
        add(viewsByUsers, view.user, url, view.date);
        add(viewsByLectures, url, view.user, view.date);
        if (!lecturesByUrl[url]) {
          let lecture = lectures.find(ll => ll.course == parseInt(c) && ll.number == parseInt(l)) || { title: url };
          lecturesByUrl[url] = lecture;
        }
      }
    }
  });

  let usersDataByEmail = {};
  Object.keys(viewsByUsers).forEach(email => { usersDataByEmail[email] = orders.find(o => o.gmail == email); })

  let lecturesStat = _.uniq(Object.keys(viewsByLectures)).map(url => {
//    console.log(url)
    let obj = lecturesByUrl[url];
    obj.users = Object.keys(viewsByLectures[url]).map(email => {
      let views = viewsByLectures[url][email];
      let playingLength = ((new Date(views[views.length-1]).getTime() - new Date(views[0]).getTime())/60000);
      return { name: usersDataByEmail[email]? usersDataByEmail[email].name + ` <${email}>`: email, time: parseInt(playingLength), firstPlay: longDate(new Date(views[views.length-1])) };
    });
    obj.users = obj.users.filter(user => { return  user.time > 10 });
    obj.url = url;
    return obj;
  })
return lecturesStat;
}

async function statsRoute(req, res, query) {

  let data = csv(fs.readFileSync('./logs/access-stats.csv', 'UTF-8'));

  data = data.filter(record => { return new Date(record.date) >= new Date(query.from) && new Date(record.date) <= new Date(query.to) });

  let lecturesStat = getLecturesStats(data);

//  console.log(data[30].date, new Date(data[30].date) >= new Date(query.from))

  const times = data.filter(rec => parseInt(rec.date)>0).map(rec => new Date(rec.date).getTime());
  let period = shortDate(new Date(query.from)) + ' - ' + shortDate(new Date(query.to));
//  let period = shortDate(new Date(Math.min(...times))) + ' - ' + shortDate(new Date(Math.max(...times)));

  // let usersByEmail = {};
  // orders.forEach(order => usersByEmail[order.gmail] = order.nameo);
//  <input id="party" type="datetime-local" name="partydate" value="2017-06-01T08:30">

  let [ date_start, date_today, date_end ] = [ shortDate2(new Date(Math.min(...times))), shortDate2(new Date()), shortDate2(new Date(Math.max(...times))) ];

  var contents = ejs.render(fs.readFileSync("./templates/stats.ejs", 'UTF-8'), { lecturesStat, period, date_start, date_today, date_end });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.writeHead(200);
  res.end(contents);
}

module.exports = statsRoute;
