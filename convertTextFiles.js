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
