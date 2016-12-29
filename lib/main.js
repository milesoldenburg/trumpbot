var Botkit = require('botkit');
var fs = require('fs');
var yaml = require('js-yaml');
var winston = require('winston');
var _ = require('underscore');

// Customize logger
var LOGGER = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            colorize : true,
            timestamp : true
        })
    ]
});

// Parse quote file into memory
var doc = yaml.safeLoad(fs.readFileSync('./lib/quotes.yml', 'utf8'));
LOGGER.info('Loaded quotes file');

var controller = Botkit.slackbot({
    debug : false
});

controller.spawn({
    token : process.env.TRUMPBOT_TOKEN
}).startRTM();

controller.hears(_.keys(doc), ['direct_message', 'ambient'], function(bot, message){
    LOGGER.info('Matched on: %s', message.match[0]);
    bot.reply(message, _.sample(doc[message.match[0]]));
});
