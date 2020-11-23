function getYouTubeURL(filename, onSuccess, onError) {
  var _ = require('lodash');
  var superagent = require('superagent');
  var fs = require('fs');

  var JSSoup = require('jssoup').default;

  if (!filename.match(/^[a-zA-Z0-9_-]{6,11}$/)) {
    onError(`Incorrect YouTube video ${filename}`);
  } else {
    superagent.get('https://www.youtube.com/watch?v=' + filename).then(response => {
      var soup = new JSSoup(response.text);
      var scriptElements = soup.findAll("script");

      var scriptElementsFiltered = scriptElements.filter(el => { return el.text.indexOf('videoplayback') >= 0 });

//      fs.writeFileSync('resp.html', scriptElementsFiltered[0].text)

      var window = {}, document = {};
      document.createElement = function() {};
      var video, contentLength;
      try {
        eval((scriptElementsFiltered[0].text));
        var data = JSON.parse(_.get(ytplayer, 'config.args.player_response')).streamingData.formats[0]
        video = data.url;
        contentLength = data.contentLength;
        onSuccess({ video: video, contentLength: contentLength });
      } catch(ex) {
        onError(ex);
      }

      // if (!video) {
      //   throw('Empty response from video');
      // }

    });
  }


}

module.exports = { getYouTubeURL };
