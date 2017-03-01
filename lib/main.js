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

var keys = _.map(_.keys(doc), function(element){
    var subkeys = element.split('|');
    return _.map(subkeys, function(subkey){
        return '\\b' + subkey + '\\b';
    }).join('|');
});

var controller = botkit.slackbot({
    debug : false
});

controller.spawn({
    token : process.env.TRUMPBOT_TOKEN
}).startRTM(function(err){
    if (err) {
        LOGGER.error('Problem connecting to Slack', err);
    }

    LOGGER.info('Connected to Slack');
});

controller.hears(keys, ['ambient'], function(bot, message){
    // Only reply if we are outside the timeout to not overload the channel
    if (moment().isSameOrAfter(nextAvailableQuote)) {
        // Find all expressions that contain the input match
        var matchedExpressions = _.filter(_.keys(doc), function(expression){
            return expression.includes(message.match[0].toLowerCase());
        });

        if (matchedExpressions.length > 0) {
            // Choose a random quote from a random matching expression
            bot.reply(message, _.sample(doc[_.sample(matchedExpressions)]));
            nextAvailableQuote = moment().add(_.random(30), 'minutes');
        }
    }
});
