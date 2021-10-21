var http = require("http"),
  fs = require("graceful-fs"),
  util = require("util"),
  querystring = require("querystring"),
  urllib = require("url"),
  ejs = require("ejs"),
  process = require("process");

var superagent = require("superagent");
var cookie = require("cookie");

const { parse } = require("fecha");

var PORT = process.argv[2] || 9300;

var log = require("simple-node-logger").createSimpleFileLogger("project2.log");

var getYouTubeURL = require("./libs").getYouTubeURL;

const {
  urlGoogle,
  getGoogleAccountFromCode,
  getAccessTokenFromCode,
  getGoogleUserInfo,
  parseCookies,
  setGoogleConfig
} = require("./libs/google-utils.js");

const { buildPlaylist, csv, parsePaidUsersFile } = require("./libs/utils.js");

const playlistRoute = require("./routes/playlist.js");
const logoutRoute = require("./routes/logout.js");
const googleAuthRoute = require("./routes/google-auth.js");

let playlist = buildPlaylist();

function getChunkHeader(range, total) {
  var parts = range.replace(/bytes=/, "").split("-");
  var partialstart = parts[0];
  var partialend = parts[1];

  var start = parseInt(partialstart, 10);
  var end = partialend ? parseInt(partialend, 10) : total - 1;
  var chunksize = end - start + 1;
  console.log(
    range,
    partialend,
    "RANGE: " + start + " - " + end + " = " + chunksize
  );
  return {
    headers: {
      "Content-Range": "bytes " + start + "-" + end + "/" + total,
      "Accept-Ranges": "bytes",
      "Content-Length": chunksize,
      "Content-Type": "video/mp4"
    },
    start: start,
    end: end
  };
}

http
  .createServer(async function(req, res) {
    setGoogleConfig({ domain: req.headers.host });

    var path = req.url.split("/");
    var [none, route, ...token] = path;
    var filename = "";

    var referer = urllib.parse(req.headers.referer || "").hostname;

    log.info(
      `Video server: access from ${req.headers["x-forwarded-for"]} for ${route}, ${req.url}`
    );

    let course, number, id;
    const lecturesMapping = ["ФИ", "ЯК", "АЭ", "ИО", "HM"];

    if (route == "playlist" || route == "video") {
      if (route == "playlist") {
        [course, number, id] = token;
      }
      if (route == "video") {
        id = token[0];
      }

      let currentOrder = await parsePaidUsersFile(id);

      if (currentOrder) {
        req.currentOrder = currentOrder;
      }

      if (route == "video") {
        filename = id;
        number = currentOrder.number;
        course = lecturesMapping.indexOf(currentOrder.course) + 1;
        const paddedNumber = number.length == 1 ? "0" + number : "" + number;
        playlist[filename] = {
          type: "local",
          path: `videos/${course}/${paddedNumber}.mp4`
        };
      }

      if (route == "playlist") {
        if (
          currentOrder &&
          parseInt(lecturesMapping.indexOf(currentOrder.course) + 1) ==
            parseInt(course) &&
            parseInt(currentOrder.number) == parseInt(number)
        ) {
          playlistRoute(req, res);
        } else {
          res.setHeader("Content-Type", "text/html");
          res.writeHead(404);
          res.end(`Video ${id} is not found`);
        }
      }
    }

    if (route == "playlist") {
    } else if (route == "logout") {
      logoutRoute(req, res);
    } else if (route == "google-auth") {
      googleAuthRoute(req, res, query);
    } else if (route == "video") {
      if (!playlist[filename]) {
        log.info(`Video server: file ${filename} not found`);
        res.setHeader("Content-Type", "text/html");
        res.writeHead(404);
        res.end(`File ${filename} is not found`);
      } else if (playlist[filename].type == "local") {
        var path = playlist[filename].path;

        if (fs.existsSync(path)) {
          var stat = fs.statSync(path);
          var total = stat.size;
          if (req.headers["range"]) {
            var chunkHeaders = getChunkHeader(req.headers.range, total);
            res.writeHead(206, chunkHeaders.headers);
            var file = fs.createReadStream(path, {
              start: chunkHeaders.start,
              end: chunkHeaders.end
            });
            file.pipe(res);
          }
        } else {
          log.info(
            `Video server: file ${filename} not found at ${playlist[filename].path}`
          );
          res.setHeader("Content-Type", "text/html");
          res.writeHead(404);
          res.end(`File ${filename} is not found`);
        }
      } else if (playlist[filename].type == "remote") {
        var path = playlist[filename].url;
        superagent.head(path).then(response => {
          var total = response.headers["content-length"];

          if (req.headers["range"]) {
            var chunkHeaders = getChunkHeader(req.headers.range, total);
            res.writeHead(206, chunkHeaders.headers);
            superagent
              .get(path)
              .set("Range", req.headers["range"])
              .pipe(res);
          }
        });
      } else if (playlist[filename].type == "youtube") {
        function onError() {
          log.error(
            `Cannot retrieve video ${playlist[filename].url}, should be unlisted or public`
          );
          res.writeHead(404);
          res.end(`Cannot retrieve video`);
        }

        function onSuccess(videoData) {
          var path = videoData.video;
          log.info(`Got metadata about ${playlist[filename].url}`);
          // const response = await superagent.head(path);
          // var total = response.headers["content-length"];
          var total = videoData.contentLength;
          log.info(`Got file length ${total}`);

          if (req.headers["range"]) {
            var chunkHeaders = getChunkHeader(req.headers.range, total);
            res.writeHead(206, chunkHeaders.headers);
            log.info(`Streaming with range ${req.headers["range"]}`);
            superagent
              .get(path)
              .set("Range", req.headers["range"])
              .buffer(true)
              .pipe(res);
          }
        }

        getYouTubeURL(playlist[filename].url, onSuccess, onError);
      } else {
        log.info(`Unknown file type ${filename}`);
        res.setHeader("Content-Type", "text/html");
        res.writeHead(404);
        res.end(`Unknown file type ${filename}`);
      }
    } else {
      log.info(`Video server: route ${route} not found`);
      res.setHeader("Content-Type", "text/html");
      res.writeHead(404);
      res.end(`Route ${route} not found`);
    }
  })
  .listen(PORT);

console.log(`Server is running on ${PORT}`);

// When you call .end() then superagent takes over response stream pipe, collects all of its data in res.body, and waits for the pipe to finish sending data.
// The callback in .end() is called after response stream pipe has finished and closed. At this point it's guaranteed that it's not possible to pipe anything anymore, because all pipes have ended and closed.
// If you want to send data from the end callback, you must use expressJsResponse.end(superagentResponse.body), because at this point in time res.body is the only place where the data exists.
