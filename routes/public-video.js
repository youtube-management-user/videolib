const ejs = require("ejs");
const fs = require("fs");

async function publicVideoRoute(req, res, title) {

  try {
    const config = fs.readFileSync(`./data/public/${title}.txt`, 'UTF-8');

    let data = {}

    console.log(config.split(/\r\n\r\n|\n\n/))

    config.split(/\r\n\r\n|\n\n/).filter(l => {return l!=''}).map(l => { 
      f = l.split(/\r\n/);
      const key = f[0].trim(); 
      data[key]=f[1];  
    });

    console.log('video', data.video)

    var contents = ejs.render(fs.readFileSync("./templates/public.ejs", "UTF-8"), data);

    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.writeHead(200);
    res.end(contents);
  } catch(ex) {
    console.log(ex);
    res.writeHead(404);
    res.end();
  }
}

module.exports = publicVideoRoute;
