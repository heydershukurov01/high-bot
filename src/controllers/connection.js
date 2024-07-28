// Express route handlers
const bot = require("../models/whatsappbot.model");
/**
 * Create QR Code for subscribtion
 * @param req
 * @param res
 */
exports.subscribe = (req, res) => {
    bot.initialize().then(() => {
        bot.subscribe().then(data => {
            console.log(data);
            res.render('qr', {url: data});
        })
    })
}
/**
 * Create QR Code for subscribtion
 * @param req
 * @param res
 */
exports.subscribeTerminal = (req, res) => {
    bot.initialize().then(() => {
        bot.subscribeTerminal();
        res.status(200).json({
            status: 'OK'
        });
    })
}

exports.initialize = (req, res) => {
    bot.initialize().then(() => {
        res.status(200).json({
            status: 'OK'
        });
    }).catch(e => {
        console.log(e);
        res.status(200).json({
            status: 'Fail'
        });
    });
}
exports.getMessages = (req, res) => {
    bot.initialize().then(() => {
        bot.getUsersAndGroupIds('𝐁𝐌𝐖 𝐀𝐋𝐏𝐈𝐍𝐄 𝐆𝐀𝐑𝐀𝐆𝐄').then(groupId => {
            bot.getMessages().then(messages => {
                res.status(200).json(messages)
            })
        })
    })
}
exports.listOfGroupMembers = (req, res) => {
    console.log('Entered!');
    bot.initialize().then(() => {
        bot.getUsersAndGroupIds('𝐁𝐌𝐖 𝐀𝐋𝐏𝐈𝐍𝐄 𝐆𝐀𝐑𝐀𝐆𝐄')
            .then(groupId => {
                if (typeof groupId === 'string') {
                    bot.getGroupMembers(groupId)
                        .then(d => {
                            res.json({
                                status: 'Ok'
                            })
                        })
                } else {
                    res.json({
                        err: 'Error Occured',
                        status: 500,
                    })
                }
            })
            .catch(e => {
                res.json({
                    err: e.message,
                    status: e.status,
                })
            });
    })
}