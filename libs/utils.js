
const fs = require('fs');

function csv(file) {
  if (!file) return null;
  let [fields, ...records] = file.split(/\n/).filter(l => l!='');

  if (!records || records.length < 1) return null;

  fields = fields.split('|');

  records = records.map(rec => {
    let res = {};
    const values = rec.split('|');
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

module.exports = { csv, buildPlaylist }
