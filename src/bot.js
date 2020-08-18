console.log('The bot is starting up!');

// Setting up imports.
var Twit = require('twit');
const config = require('../config.json');
const foods = require('../data/foods.json');
const foodSuggestionSentences = require('../data/sentences.json').food_suggestions;
const commandNotRecognizedSentences = require('../data/sentences.json').command_not_recognized;

// Setting up global variables.
const dateArray = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
var lastTweetSent = '';
var T = new Twit(config);

// Setting up user stream.
var stream = T.stream('statuses/filter', {track: '@FoodGuruBot'});

stream.on('tweet', tweetedAt);

// Called when an new event happens on the stream connection.
function tweetedAt(eventMessage) {
  // Check to see if this is a tweet towards me.
  if (eventMessage.in_reply_to_screen_name === 'FoodGuruBot'){
    let incomingTweetIdStr = eventMessage.id_str;
    let screenName = eventMessage.user.screen_name;

    let tweetText = trimTweet(eventMessage.text);
    let commandObject = getCommandObject(tweetText);

    let messageText = generateMessageText(screenName, commandObject);

    sendTweet(incomingTweetIdStr, messageText);
  }
}

// Replies to incoming tweet.
function sendTweet(incomingTweetIdStr, messageText) {

  // Update the lastTweetSent variable, so we can make sure to not send duplicate tweets
  // later on.
  lastTweetSent = messageText;

  let params = {
    in_reply_to_status_id: incomingTweetIdStr,
    status: messageText
  };

  T.post('statuses/update', params).catch((err) => {
    console.log(err);
  });
}

function trimTweet(tweetText) {
  let newText;
  newText = tweetText.replace(new RegExp('@FoodGuruBot', 'ig'), '');
  newText = newText.trim();
  return newText;
}

function getCommandObject(tweetText) {
  let commandObject = {};

  let tweetTextLowerCase = tweetText.toLowerCase();

  if (tweetTextLowerCase.startsWith('i\'m hungry')) {
    commandObject['id'] = 1;
  } else if (tweetTextLowerCase.startsWith('pick one:')) {
    commandObject['id'] = 2;
    commandObject['options'] = getPickOptions(tweetText);
  } else {
    commandObject['id'] = -1;
  }

  return commandObject;
}

function getPickOptions(tweetText) {
  tweetText = tweetText.replace(new RegExp('pick one:', 'ig'), '');
  tweetText = tweetText.trim();

  let options = tweetText.split(',');

  options = options.map((option) => {
    // Removes additional punctuation.
    option = option.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
    // Removes any extra whitespace cause by punctuation removal.
    option = option.replace(/\s{2,}/g,' ');
    // Final trim just to make sure.
    option = option.trim();

    return option;
  });

  return options;
}

function generateMessageText(screenName, commandObject) {
  let messageText = '';

  switch (commandObject.id) {
    // I'm hungry command, select a food from internal data for user.
    case 1: {
      let day = dateArray[new Date().getDay()];
      let foodOptions = foods[day.toLowerCase().charAt(0)];
      let food = '';
      let sentence = '';

      // Do-while to avoid duplicate tweets.
      do {
        food = foodOptions[Math.floor(Math.random() * foodOptions.length)];
        sentence = foodSuggestionSentences[Math.floor(Math.random() * foodSuggestionSentences.length)];
        let foodSentence = sentence.replace('*', food + ' ' + day);
        messageText = '@' + screenName + ' ' + foodSentence;
      } while (messageText === lastTweetSent);
      break;
    }
    // Pick one command, select a food from user-specified list.
    case 2: {
      foodOptions = commandObject.options;
      let food = '';

      // Do-while to avoid duplicate tweets.
      do {
        food = foodOptions[Math.floor(Math.random() * foodOptions.length)];
        messageText = '@' + screenName + ' ' + food;
      } while (messageText === lastTweetSent);
      break;
    }
    default: {
      // Do-while to avoid duplicate tweets.
      do {
        let sentence = commandNotRecognizedSentences[Math.floor(Math.random() * commandNotRecognizedSentences.length)];
        messageText = '@' + screenName + ' ' + sentence;
      } while (messageText === lastTweetSent);
    }
  }

  return messageText;
}