
const cookie = require('cookie');
const ejs = require("ejs");
const fs = require('fs');
const _ = require('lodash');

const { csv, buildPlaylist, parsePaidUsersFile } = require('../libs/utils.js');

async function playlistRoute(req, res) {

  const filename = (req.currentOrder && req.currentOrder.id)? req.currentOrder.id: null;

  var contents = ejs.render(fs.readFileSync("./templates/playlist.ejs", 'UTF-8'), { user: {}, googleLink: {}, filename });

  res.setHeader("Content-Type", "text/html");
  res.writeHead(200);
  res.end(contents);
}

module.exports = playlistRoute;
