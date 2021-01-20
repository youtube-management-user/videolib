
async function notFoundRoute(req, res, route) {
  console.log(`Video server: route ${route} not found`);
  res.setHeader("Content-Type", "text/html");
  res.writeHead(404);
  res.end(`Route ${route} not found`);
}

module.exports = notFoundRoute;
