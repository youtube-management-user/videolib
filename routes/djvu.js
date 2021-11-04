const fs = require("graceful-fs");

async function djvuRoute(req, res, filename) {
  let path = "";
  try {
    path = decodeURI(`./djvu/${filename}`).split("?")[0];
  } catch (ex) {
    console.log(`Broken URL {path}`);
  }

  if (fs.existsSync(path) && !fs.lstatSync(path).isDirectory()) {
    res.setHeader("Content-Type", "image/vnd.djvu");
    res.writeHead(200);
    res.end(fs.readFileSync(path));
    return;
  } else {
    res.writeHead(404);
    res.end(`File ${path} is not found`);
  }
}

module.exports = djvuRoute;
