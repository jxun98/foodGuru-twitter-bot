console.log('The bot is starting up!');

var Twit = require('twit');
const config = require('../config.json');

var T = new Twit(config);