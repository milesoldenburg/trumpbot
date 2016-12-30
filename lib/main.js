var botkit = require('botkit');
var fs = require('fs');
var yaml = require('js-yaml');
var moment = require('moment');
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

var nextAvailableQuote = moment();

// Parse quote file into memory
var doc = yaml.safeLoad(fs.readFileSync('./lib/quotes.yml', 'utf8'));
LOGGER.info('Loaded quotes file');

var controller = botkit.slackbot({
    debug : false
});

controller.spawn({
    token : process.env.TRUMPBOT_TOKEN
}).startRTM();

controller.hears(_.keys(doc), ['direct_message'], function(bot, message){
    // Only reply if we are outside the timeout to not overload the channel
    if (moment().isSameOrAfter(nextAvailableQuote)) {
        // Find all expressions that contain the input match
        var matchedExpressions = _.filter(_.keys(doc), function(expression){
            return expression.includes(message.match[0]);
        });

        // Choose a random quote from a random matching expression
        bot.reply(message, _.sample(doc[_.sample(matchedExpressions)]));
        nextAvailableQuote = moment().add(15, 'minutes');
    }
});
