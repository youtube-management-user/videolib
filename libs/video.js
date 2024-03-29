var superagent = require("superagent");
var fs = require("graceful-fs");

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

function getYouTubeURL(filename, onSuccess, onError) {
  var JSSoup = require("jssoup").default;

  if (!filename.match(/^[a-zA-Z0-9_-]{6,11}$/)) {
    onError(`Incorrect YouTube video ${filename}`);
  } else {
    superagent
      .get("https://www.youtube.com/watch?v=" + filename)
      .then(response => {
        console.log("https://www.youtube.com/watch?v=" + filename);
        //      console.log(111, filename)
        var soup = new JSSoup(response.text);
        var scriptElements = soup.findAll("script");

        var scriptElementsFiltered = scriptElements.filter(el => {
          return el.text.indexOf("videoplayback") >= 0;
        });

        //      console.log(scriptElements)

        //      fs.writeFileSync('resp.html', scriptElementsFiltered[0].text)
        if (!scriptElementsFiltered[0] || !scriptElementsFiltered[0].text) {
          const err = "Cannot extract URL. Video is private or unreachable.";
          onError(err);
          console.error(err);
          return;
        }

        var window = {},
          document = {};
        document.createElement = function() {
          return {};
        };
        document.getElementsByTagName = function() {
          return [{ appendChild: function() {} }];
        };
        var video, contentLength;
        try {
          // const url = scriptElementsFiltered[0].text.match(/\"(https\:\/\/[^\"]+googlevideo[^\"]+)\"/)[1];
          //        let ytplayer = JSON.parse(json);
          eval(scriptElementsFiltered[0].text);
          var data = ytInitialPlayerResponse.streamingData.formats[0];
          video = data.url;
          contentLength = data.contentLength || 1393902698 * 2;
          console.log(222, contentLength)
          console.log(333, data)
          onSuccess({ video, contentLength });
        } catch (ex) {
          console.log(ex);
          onError(ex);
        }
      });
  }
}

module.exports = { getChunkHeader, getYouTubeURL };

// When you call .end() then superagent takes over response stream pipe, collects all of its data in res.body, and waits for the pipe to finish sending data.
// The callback in .end() is called after response stream pipe has finished and closed. At this point it's guaranteed that it's not possible to pipe anything anymore, because all pipes have ended and closed.
// If you want to send data from the end callback, you must use expressJsResponse.end(superagentResponse.body), because at this point in time res.body is the only place where the data exists.
