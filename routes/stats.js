
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
  })

  let usersDataByEmail = {};
  Object.keys(viewsByUsers).forEach(email => { usersDataByEmail[email] = orders.find(o => o.gmail == email); })

  let lecturesStat = _.uniq(Object.keys(viewsByLectures)).map(url => {
    console.log(url)
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

  const times = data.filter(rec => parseInt(rec.date)>0).map(rec => new Date(rec.date).getTime());
  let period = shortDate(new Date(Math.min(...times))) + ' - ' + shortDate(new Date(Math.max(...times)));

  let usersByEmail = {};
  orders.forEach(order => usersByEmail[order.gmail] = order.nameo);

  var contents = ejs.render(fs.readFileSync("./templates/stats.ejs", 'UTF-8'), { lecturesStat, period });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.writeHead(200);
  res.end(contents);
}

module.exports = statsRoute;
