const fs = require("graceful-fs");

async function imgRoute(req, res, filename) {
  res.setHeader("Content-Type", "image/png");
  try {
    const content = fs.readFileSync(`./templates/img/${filename}`);
    res.writeHead(200);
    res.end(content);
  }
  catch(ex) {
    res.writeHead(404);
    res.end();
  }
  return;
}

module.exports = imgRoute;
