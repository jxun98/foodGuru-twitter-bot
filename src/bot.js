console.log('The bot is starting up!');

var Twit = require('twit');
const config = require('../config.json');

var T = new Twit(config);

// Setting up user stream.
var stream = T.stream('statuses/filter', {track: '@FoodGuruBot'});

stream.on('tweet', followed);

function followed(eventMessage) {
  console.log('We got a tweet!');
  console.log(eventMessage);
  let screenName = eventMessage.user.screen_name;
  let message = '@' + screenName + ' What\'s good my guy?';
  sendTweet(message);
}

function sendTweet(tweet) {
  T.post('statuses/update', {status: tweet});
}