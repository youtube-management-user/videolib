
const fs = require('fs');

async function cssRoute(req, res, filename) {
  const file = fs.readFileSync(`./public_images/${filename}`);
  res.setHeader('Content-Type', 'image/png');
  res.setHeader('Content-Length', file.length);
  res.end(file);
  return;
}

module.exports = cssRoute;
