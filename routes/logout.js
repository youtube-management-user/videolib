
function logoutRoute(req, res) {
  req.user = {};
  res.setHeader("Set-Cookie", "token=deleted; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT");
  res.statusCode = 302;
  res.setHeader('Location', '/playlist/');
  res.end();  
}

module.exports = logoutRoute;
