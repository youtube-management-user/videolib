
const fs = require('fs');
//const { parse } = require('fecha');
const fetch = require('node-fetch');

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
    let youtubeIds = fs.readFileSync(`./txt/youtube_${i}_id.txt`, 'UTF-8').split(/[\n\r]+/).filter(l => l!='');
    youtubeMapping[lecturesMapping[i-1]] = youtubeIds;
    youtubeIds.forEach((id,ind) => {
      playlist[`${coursesLatinMapping[lecturesMapping[i-1]]}-${ind}`] = { type: 'youtube', url: id }
    })
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

async function parsePaidUsersFile(id) {

  // const response = await fetch('http://velikanov.ru/txt/paid_h.txt');
  // const body = await response.buffer();
  // console.log(444, body.toString('utf16le'))

  let currentOrder = null;
  try {
    const body = fs.readFileSync('./txt/paid_h.txt', 'UTF-8')

    let orders = csv(body);
//    console.log('body', id)
//    console.log(orders[orders.length-1])
    orders = orders
    .map(rec => { 
      rec.begin = parse(rec.begin.split(' ')[0]);
      rec.end = parse(rec.end, 1); return rec;
    })
//    console.log(new Date(), new Date(parse()) <= new Date() && new Date() <= new Date(order.end))

//    console.log(orders.find(order => order.id == id && parseInt(order.okl) === 1))

    currentOrder = orders.find(order => order.id == id && parseInt(order.okl) === 1 && (new Date(order.begin) <= new Date() && new Date() <= new Date(order.end)));
//    currentOrder = orders.find(order => order.id == id && parseInt(order.okl) === 1);
  } catch(ex) {
    console.log('err when get file', ex)
  };

  return currentOrder;

}

module.exports = { csv, buildPlaylist, parsePaidUsersFile }
