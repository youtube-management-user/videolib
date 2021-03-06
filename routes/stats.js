
const ejs = require("ejs");
const fs = require('fs');
const _  = require('lodash');

const { csv, reloadPaidFile } = require('../libs/utils.js');

let orders = [];
try {
  orders = JSON.parse(fs.readFileSync('./txt/orders.json', 'UTF-8'));
} catch(ex) {
  reloadPaidFile();
}

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
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}

function add(obj, key1, key2, elem) {
  if (!obj[key1]) obj[key1] = {};
  if (!obj[key1][key2]) obj[key1][key2] = [];
  obj[key1][key2].push(elem);
}

function parseViewUrl(view) {
  const coursesLatinMapping = { 'FI': 1, 'YK': 2, 'AE': 3, 'IO': 4, 'HM': 5 };
  let url, c, l;

  [noop, c, l] = view.url.match(/video\/(\w+)\-(\d+)/);
  c = coursesLatinMapping[c];
  url = `${parseInt(c)}/${parseInt(l)}`;

  return [c, l, url];
}

function groupBy( array , f )
{
  var groups = {};
  array.forEach( function( o )
  {
    var group = JSON.stringify( f(o) );
    groups[group] = groups[group] || [];
    groups[group].push( o );
  });
  return Object.keys(groups).map( function( group )
  {
    return groups[group];
  })
}

function getLecturesStats(data) {

  data = data.map(rec => {
    let [c, l, parsedUrl] = parseViewUrl(rec);
    return { c, l, parsedUrl, ...rec }
  });

  let grouped = groupBy(data, rec => { return [rec.parsedUrl, rec.user] });

  let usersDataByEmail = {};
  orders.forEach(o => { if (!usersDataByEmail[o.gmail]) usersDataByEmail[o.gmail] = o.name });

  let lecturesByUrl = {};
  lectures.forEach(l => { const url = `${l.course}/${l.number}`; if (!lecturesByUrl[url]) lecturesByUrl[url] = l });

  grouped = grouped.map(user => {
    let email = user[0].user;
    let name = usersDataByEmail[email] || email;
    let lecture = lecturesByUrl[user[0].parsedUrl] || { title: user[0].parsedUrl, courseLetters: 'AAA', number: 111 };
    let times = user.map(rec => rec.date);
    let totalmin = parseInt((new Date(times[times.length-1]).getTime() - new Date(times[0]).getTime())/60000);

    return { name, email, totalmin, lectureTitle: lecture.title, lectureAbbr: `${lecture.courseLetters}-${lecture.number}` };

    return user.map(rec => rec.date).join(',')
  });

  grouped = grouped.filter(rec => rec.totalmin>1)

  return grouped;

}

async function statsRoute(req, res, query) {

  let data = csv(fs.readFileSync('./logs/access-stats.csv', 'UTF-8'));

  data = data.filter(rec => _.get(rec, 'url')? rec.url.match(/video\/(\w+)\-(\d+)/): false );

  const times = data.filter(rec => parseInt(rec.date)>0).map(rec => new Date(rec.date).getTime());

  if (query && query.from && query.to) {
    data = data.filter(record => { return new Date(record.date) >= new Date(query.from) && new Date(record.date) <= new Date(query.to  + ' 23:59:00') });
  }

  let lecturesStat = _.uniq(data.map(d => shortDate2(new Date(d.date)))).map(day => {
    let thisDayData = data.filter(r => { return shortDate2(new Date(r.date)) == shortDate2(new Date(day)) });
    let recs = getLecturesStats(thisDayData);
    let totalmin = recs.reduce((acc, curr) => { return acc + curr.totalmin }, 0);
    return { data: recs, day: shortDate(new Date(day)), totalmin };
  });

  lecturesStat = lecturesStat.filter(l => l.totalmin > 0);

//  console.log(lecturesStat[lecturesStat.length-1])

  let period;
  if (query && query.from && query.to) {
    period = shortDate(new Date(query.from)) + ' - ' + shortDate(new Date(query.to));
  }

  let date_start = (query && query.from)? query.from: shortDate2(new Date(Math.min(...times)));
  let date_end = (query && query.to)? query.to: shortDate2(new Date(Math.max(...times)));

  let pickerStart = shortDate2(new Date(Math.min(...times)));
  let pickerEnd = shortDate2(new Date(Math.max(...times)));

  let date_today = shortDate2(new Date());

  var contents = ejs.render(fs.readFileSync("./templates/stats.ejs", 'UTF-8'), { lecturesStat, period, date_start, date_today, date_end, pickerStart, pickerEnd });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.writeHead(200);
  res.end(contents);
}

module.exports = statsRoute;
