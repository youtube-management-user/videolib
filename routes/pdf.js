
const fs = require('fs');

async function pdfRoute(req, res, filename) {

  const path = decodeURI(`./pdf/${filename}`);

  if (fs.existsSync(path)) {
    res.setHeader("Content-Type", "application/pdf");
    res.writeHead(200);
    res.end(fs.readFileSync(path));
    return;

  } else {
    res.writeHead(404);
    res.end(`File ${path} is not found`);
  }
}

module.exports = pdfRoute;
