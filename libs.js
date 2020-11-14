async function getYouTubeURL(filename) {
  const _ = require('lodash');
  const superagent = require('superagent');
  var JSSoup = require('jssoup').default;

  if (!filename.match(/^[a-zA-Z0-9_-]{6,11}$/)) {
    throw(`Incorrect YouTube video ${filename}`);
  }

  const response = await superagent.get('https://www.youtube.com/watch?v=' + filename);

  var soup = new JSSoup(response.text);
  let scriptElements = soup.findAll("script");

  let scriptElementsFiltered = scriptElements.filter(el => { return el.text.indexOf('videoplayback') >= 0 });

  let window = {}, document = {};
  document.createElement = function() {};
  let video;
  try {
    eval((scriptElementsFiltered[0].text));
    video = JSON.parse(_.get(ytplayer, 'config.args.player_response')).streamingData.formats[0].url;
  } catch(ex) {

  }

  if (!video) {
    throw('Empty response from video');
  }

  return video;
}

module.exports = { getYouTubeURL };
