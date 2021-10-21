const fs = require("graceful-fs");

async function pdfRoute(req, res, filename) {
  let path = "";
  try {
    path = decodeURI(`./pdf/${filename}`).split("?")[0];
  } catch (ex) {
    console.log(`Broken URL {path}`);
  }

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
