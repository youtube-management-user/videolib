
async function testRoute(req, res) {
  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  res.end('ok');
}

module.exports = testRoute;
