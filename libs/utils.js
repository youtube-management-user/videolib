
const fs = require('fs');
//const { parse } = require('fecha');
const fetch = require('node-fetch');
const _ = require('lodash');

function csv(file) {
  if (!file) return null;
  let [fields, ...records] = file.split(/\n/).filter(l => l!='');

  if (!records || records.length < 1) return null;

  fields = fields.replace(/[\n\r\s]+/g, '').split('|');

  records = records.map(rec => {
    let res = {};
    let values = rec.replace(/[\n\r]+/g, '').split('|');
    values.forEach((val, ind) => res[fields[ind]] = values[ind]);
    return res;
  });

  return records;
}

function buildPlaylist() {
  let playlist = {};
  const lecturesMapping = [ 'ФИ', 'ЯК', 'АЭ', 'ИО', 'HM' ];
  const coursesLatinMapping = { 'ФИ': 'FI', 'ЯК' : 'YK', 'АЭ': 'AE', 'ИО': 'IO', 'HM': 'HM' };

  let youtubeMapping = {};
  for (var i=1; i<=5; i++) {
    const path = `./local_id/local_${i}_id.txt`
    if (fs.existsSync(path)) {
      let youtubeIds = fs.readFileSync(path, 'UTF-8').split(/[\n\r]+/).filter(l => l!='');
      youtubeMapping[lecturesMapping[i-1]] = youtubeIds;
      youtubeIds.forEach((id,ind) => {
        const [local, youtube, medium, low] = id.split('|');
        const type = (local!='' || medium!='')? { type: 'local', path: local? './videos/' + local: null, medium: medium? './videos/' + medium: null, low: low? './videos/' + low: null }: { type: 'youtube', url: youtube }
        playlist[`${coursesLatinMapping[lecturesMapping[i-1]]}-${ind+1}`] = type;
      })
    }
  }
  return playlist;
}

function parse(date, daysToAdd) {
  var parts = date.split(".");
  var dt = new Date(parseInt(parts[2], 10),
                    parseInt(parts[1], 10) - 1,
                    parseInt(parts[0], 10) + (daysToAdd || 0),
                    // parseInt(parts[3], 10),
                    // parseInt(parts[4], 10),
                  );
  return dt;
}

async function getOpenOrders(email) {

  if (!fs.existsSync('./txt/orders.json')) {
    try {
      await reloadPaidFile();
    } catch(ex) {
      return null;
    }
  } else {

    let currentOrder = null;
    try {
      const orders = JSON.parse(fs.readFileSync('./txt/orders.json', 'UTF-8'));
      let openOrders = [];
      openOrders = orders.filter(order => {
        const isTime = new Date(order.begin) <= new Date() && new Date() <= new Date(order.end);
        const isPersonalOrder = order.gmail == email && (parseInt(order.okl) === 1 || parseInt(order.okl) === 2);
        const isOpenForEveryone = parseInt(order.okl) === 4;
        return (isPersonalOrder || isOpenForEveryone) && isTime;
      });

      return openOrders;
    } catch(ex) {
      console.log(ex)
      return null;
    };
  }
}

async function fetchPaidFile() {
  let orders = [];
  try {
    const response = await fetch('http://velikanov.ru/txt/paid_h.txt');
    let body = await response.buffer();
    body = body.toString('utf16le');
    let orders = csv(body);
    orders = orders
    .map(rec => {
      rec.begin = parse(rec.begin.split(' ')[0]);
      rec.end = parse(rec.end, 1); return rec;
    });
    return orders;
  }
  catch(ex) {
    console.log('Error while fetching paid_h', ex);
    return;
  }
}

async function reloadPaidFile() {
  let orders = await fetchPaidFile();
  if (orders && orders.length > 0) {
    console.log('Writing new orders cache')
    fs.writeFileSync('./txt/orders.json', JSON.stringify(orders));
    return orders;
  }
  else return null;
}

let syncPaidFileStatusesRunning = false;

async function syncPaidFileStatuses() {

  // const domain = 'http://localhost:9300/test';
  const domain = 'http://velikanov.ru';

  try {
    const response = await fetch(domain);
  } catch(ex) {
    console.error(`Domain ${domain} is unreachable, cannot sync orders status ${ex}`);
    return;
  }

  if (syncPaidFileStatusesRunning === false) {
    syncPaidFileStatusesRunning = true;
    await reloadPaidFile();
//    let orders = await fetchPaidFile();
    const orders = JSON.parse(fs.readFileSync('./txt/orders.json', 'UTF-8'));
    let openOrders = orders.filter(order => (parseInt(order.okl) === 1) && (new Date(order.begin) <= new Date() && new Date() <= new Date(order.end)));
    let closedOrders = orders.filter(order => (parseInt(order.okl) === 1 || parseInt(order.okl) === 2 || parseInt(order.okl) === 4) && (new Date(order.begin) > new Date() || new Date() > new Date(order.end)));

    let openOrderLinks = openOrders.map(order => {
  //    const id = orders.findIndex(o => o.id == order.id) + 2;
      return  `${domain}/read_orders_hand6.asp?a=6&b=2&move=0&tid=${order.id}&pass=Bgt57140135`
    });

    console.log('openOrderLinks', openOrderLinks)

    let closedOrderLinks = closedOrders.map(order => {
//      const id = orders.findIndex(o => o.id == order.id) + 2;
      return  `${domain}/read_orders_hand6.asp?a=6&b=3&move=0&tid=${order.id}&pass=Bgt57140135`
    });

    console.log('closedOrderLinks', closedOrderLinks)

    let links = openOrderLinks.concat(closedOrderLinks);

    for (const link of links) {
      if (link!='' && link.indexOf('http')>=0) {
        let linkText = link.replace(/(pass\=[^&]+)/g, '');
        console.log(`Calling ${linkText}`)
        try {
          const response = await fetch(link);
          console.log(`Response is ${response.status}`);
        } catch(ex) {
          console.log(`Error ${ex}`);
        }
      }
    }

    syncPaidFileStatusesRunning = false;
  }
}

function convertTextFiles() {
  const fs = require('fs');
  const glob = require('glob');

  const lecturesMapping = [ 'ФИ', 'ЯК', 'АЭ', 'ИО', 'HM' ];
  const lecturesHeadersMapping = [ 'Философия искусства', 'Языки культуры', 'Анаморфическая энциклопедия', 'Идеи и образы', 'Homo mutabilis' ];
  const coursesLatinMapping = [ 'FI', 'YK', 'AE', 'IO', 'HM' ];

  const result = [];
  for (var i=1; i<=5; i++) {
    glob(`./txt/${i}/*.txt`, {}, function(err, files) {
      if (files.length > 0) {
        files.forEach(path => {
          const pathArr = path.split('/');
          const course = pathArr[pathArr.length-2];
          filename = pathArr[pathArr.length-1];
          const number = filename.replace('.txt', '');

          let lectureData = {};

          var data = fs.readFileSync(path, 'UTF-8').split(/\r\n\r\n|\n\n/).filter(l => l!='');

          data.forEach(part => {
            part = part.replace(/^[^a-zA-Z]+/, '');
            let [key, ...value] = part.split(/[\r]*\n/);
            key = key.replace(/[^a-zA-Z+]/, '');
            value = value.filter(v => v!='');
  //          console.log(222, key, value)
            if (value!='') {
              if (value.length == 1) {
                value = value[0];
                if (value.replace(/^\s+\|\s+$/g, '')=='')
                  value = '';
              }
              lectureData[key] = value;
            }
          });

          lectureData.courseHeader = lecturesHeadersMapping[course-1];
          lectureData.course = parseInt(course);
          lectureData.courseLetters = lecturesMapping[course-1];
          lectureData.link = `${course}/${number}`;
          lectureData.video = `${coursesLatinMapping[course-1]}-${number}`;
          lectureData.courseGlobalNum = parseInt(course) + 13;
          lectureData.number = parseInt(number);
          if (lectureData.literature) {
            lectureData.literature = lectureData.literature.map(l => l.split('|'));
          }
          if (lectureData.movies) {
            lectureData.movies = lectureData.movies.map(l => l.split('|'));
          }

          result.push(lectureData);

        })
      }
      fs.writeFileSync('./txt/lectures.json', JSON.stringify(result, null, 2));
    });
  }
}

module.exports = { csv, buildPlaylist, getOpenOrders, reloadPaidFile, syncPaidFileStatuses, convertTextFiles }
