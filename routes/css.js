
const fs = require('fs');

async function cssRoute(req, res, filename) {
  res.setHeader("Content-Type", "text/css");
  res.writeHead(200);
  res.end(fs.readFileSync(`./templates/css/${filename}`));
  return;
}

module.exports = cssRoute;
