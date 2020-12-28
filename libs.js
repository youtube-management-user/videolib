function getYouTubeURL(filename, onSuccess, onError) {
  var _ = require('lodash');
  var superagent = require('superagent');
  var fs = require('fs');

//  console.log('getYouTubeURL')

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
      document.createElement = function() { return {} };
      document.getElementsByTagName = function() { return [{ appendChild: function() {} }] }
     var video, contentLength;
      try {
        // const url = scriptElementsFiltered[0].text.match(/\"(https\:\/\/[^\"]+googlevideo[^\"]+)\"/)[1];
//        let ytplayer = JSON.parse(json);
        eval(scriptElementsFiltered[0].text)
        var data = ytInitialPlayerResponse.streamingData.formats[0]
        video = data.url;
        contentLength = data.contentLength;
        onSuccess({ video, contentLength });
      } catch(ex) {
        console.log(ex)
        onError(ex);
      }

    });
  }


}

module.exports = { getYouTubeURL };
