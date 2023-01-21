const fs = require("fs");

async function htmlRoute(req, res, fname) {

  res.setHeader("Content-Type", "text/html");

  const path = `./html/${fname}`;

  try {
    const html = fs.readFileSync(path, 'UTF8')
    res.writeHead(200);
    res.end(html);
  } catch(ex) {
    console.log(`File cannot be found at ${path}`);
    console.log(ex);
    res.writeHead(404);
    res.end("Page not found");
  }

}

module.exports = htmlRoute;
