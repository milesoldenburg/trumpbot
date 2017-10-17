'use strict';

// Dependencies
const botkit = require('botkit'),
    fs = require('fs'),
    yaml = require('js-yaml'),
    moment = require('moment'),
    winston = require('winston'),
    _ = require('underscore');

// Plugins
require('moment-duration-format');

// @trumpbot's last day in office
const lastDayInOffice = moment('2021-01-20 09-0500');

// Customize logger
const LOGGER = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            colorize : true,
            timestamp : true
        })
    ]
});

let nextAvailableQuote = moment();

// Parse quote file into memory
const doc = yaml.safeLoad(fs.readFileSync('./lib/quotes.yml', 'utf8'));
LOGGER.info('Loaded quotes file');

const keys = _.map(_.keys(doc), function(element){
    const subkeys = element.split('|');
    return _.map(subkeys, function(subkey){
        return '\\b' + subkey + '\\b';
    }).join('|');
});

const controller = botkit.slackbot({
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

// Listens for keywords to pick quotes
controller.hears(keys, ['ambient'], function(bot, message){
    // Only reply if we are outside the timeout to not overload the channel
    if (moment().isSameOrAfter(nextAvailableQuote) || process.env.TRUMPBOT_DEBUG) {
        // Find all expressions that contain the input match
        const matchedExpressions = _.filter(_.keys(doc), function(expression){
            const re = new RegExp('\\b(\\|)*' + message.match[0].toLowerCase() + '(\\|)*\\b');
            return re.test(expression);
        });

        if (matchedExpressions.length > 0) {
            // Choose a random quote from a random matching expression
            bot.reply(message, _.sample(doc[_.sample(matchedExpressions)]));
            nextAvailableQuote = moment().add(_.random(30), 'minutes');
        }
    }
});

// Replies with how long @trumpbot has left in office
controller.hears('long(.*)office', ['direct_mention', 'mention'], function(bot, message){
    bot.reply(message, 'I\'ll be your greatest and smartest president for ' + moment.duration(lastDayInOffice.diff(moment(), 'minutes'), 'minutes').format('y [years], M [months], d [days], h [hours], [and] m [minutes].'));
});
