
async function healthRoute(req, res, params) {

  let data = params;

  res.setHeader("Content-Type", "application/json");
  res.writeHead(200);
  res.end(JSON.stringify(data));
}

module.exports = healthRoute;
