const fs = require("graceful-fs");

async function imgRoute(req, res, filename) {
  res.setHeader("Content-Type", "image/png");
  res.writeHead(200);
  res.end(fs.readFileSync(`./templates/img/${filename}`));
  return;
}

module.exports = imgRoute;
