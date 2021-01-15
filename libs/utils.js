
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
    const path = `./local_id/local_${i}_id.txt`
    if (fs.existsSync(path)) {
      let youtubeIds = fs.readFileSync(path, 'UTF-8').split(/[\n\r]+/).filter(l => l!='');
      youtubeMapping[lecturesMapping[i-1]] = youtubeIds;
      youtubeIds.forEach((id,ind) => {
        const [local, youtube] = id.split('|');
        const type = local!=''? { type: 'local', path: './videos/' + local }: { type: 'youtube', url: youtube }
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

async function parsePaidUsersFile(id) {

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
      currentOrder = orders.find(order => order.id == id && (parseInt(order.okl) === 1 || parseInt(order.okl) === 2 ) && (new Date(order.begin) <= new Date() && new Date() <= new Date(order.end)));
      console.log(111, currentOrder)
  //    currentOrder = orders.find(order => order.id == id && parseInt(order.okl) === 1);
    } catch(ex) {
      console.log(ex)
      return null;
    };
    return currentOrder;

  }

}

async function reloadPaidFile() {

  try {
    // const response = await fetch('http://velikanov.ru/txt/paid_h.txt');
    // let body = await response.buffer();
    // body = body.toString('utf16le');
    let body = fs.readFileSync('./txt/paid_h.txt', 'UTF-8');
    let orders = csv(body);
    orders = orders
    .map(rec => {
      rec.begin = parse(rec.begin.split(' ')[0]);
      rec.end = parse(rec.end, 1); return rec;
    });
    fs.writeFileSync('./txt/orders.json', JSON.stringify(orders));
    return;
  }
  catch(ex) {
    console.log('Error while fetching paid_h', ex);
    return;
  }


}

module.exports = { csv, buildPlaylist, parsePaidUsersFile, reloadPaidFile }
