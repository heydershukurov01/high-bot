const { Client, LocalAuth } = require('whatsapp-web.js');
const puppeteer = require('puppeteer');
const qrcodeTerminal = require('qrcode-terminal');
const qrcode = require('qrcode');
const AI = require('./ai.model');
const Wuser = require('../db/wusers');
const Message = require('../db/messages');
class WhatsAppBot {
    constructor() {
        this.initialized = false;
        this.initilizer().then(init => {
            this.send = true;
            this.client.on('ready', () => {});
        });
    }
    async tester() {
        console.log('Entered')
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser', // Path to Chromium executable
            headless: true, // Run in headless mode
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-accelerated-2d-canvas',
                '--no-first-run',
                '--no-zygote',
                '--single-process',
                '--disable-gpu',
                '--user-data-dir=/root/chromium-data'
            ]
        });
        console.log('Page')
        // Create a new page
        const page = await browser.newPage();
        console.log('GOTO')
        // Navigate to a website
        await page.goto('https://google.com');
        console.log('Screenshot')
        // Take a screenshot and save it to the local file system
        await page.screenshot({ path: 'example.png' });
        console.log('Browser close')
        // Close the browser
        await browser.close();
    }
    async initilizer() {
        if (process.env.NODE_ENV === 'production') {
            console.log('Initialized')
            this.client = new Client({
                puppeteer: {
                    executablePath: '/usr/bin/chromium-browser',
                    headless: true,
                    args: [
                        '--disable-dev-shm-usage',
                        '--disable-accelerated-2d-canvas',
                        '--no-first-run',
                        '--no-sandbox',
                        '--no-zygote',
                        '--single-process',
                        '--disable-gpu',
                        '--user-data-dir=/home/bot/chromium-sandbox'
                    ]
                },
                authStrategy: new LocalAuth()
            });
        } else {
            this.client = new Client({
                authStrategy: new LocalAuth()
            });
        }
    }
    // Method to initialize the WhatsApp client
    initialize() {
        return new Promise((success, fail) => {
            try {
                if (this.initialized) {
                    this.client.getState().then(state => {
                        console.log('State: ' + state);
                        success();
                    })
                } else {
                    if (this.client) {
                        this.client.initialize().then(t => {
                            this.client.on('ready', () => {
                                console.log('Ready');
                                this.initialized = true;
                                success();
                            });
                            this.client.on('message', this.handleMessage.bind(this));
                        });
                    } else {
                        this.initilizer()
                        this.client.initialize().then(t => {
                            this.client.on('ready', () => {
                                console.log('Ready');
                                this.initialized = true;
                                success();
                            });

                            this.client.on('message', this.handleMessage.bind(this));
                        });
                    }
                }
            } catch (e) {
                fail(e);
            }
        })
    }

    /**
     * Create QR Code for Subscribtion
     */
    subscribe() {
        return new Promise((success, fail) => {
            this.client.on('qr', (qr) => {
                qrcode.toDataURL(qr, (err, url) => {
                    if (err) {
                        console.error('Error generating QR code', err);
                        fail(err.message)
                    } else {
                        success(url);
                    }
                });
            });
        });
    }
    subscribeTerminal() {
        this.client.on('qr', (qr) => {
            qrcodeTerminal.generate(qr, {small: true});
        });
    }
    // Method to get group chats and start listening for messages from a specific group
    async getUsersAndGroupIds(groupName) {
        console.log(groupName);
        return new Promise((success, fail) => {
            try {
                this.client.getState().then(state => {
                    console.log('State: ' + state)
                })
                console.log('Chats');
                this.client.getChats().then(chats => {
                    const groups = chats.filter(chat => chat.isGroup);
                    groups.forEach(group => {
                        // Check if the group name matches the desired group
                        if (group.name.includes(groupName)) {
                            this.targetGroupId = group.id._serialized;
                            console.log(`Listening to messages from group: ${group.name}`);
                            success(this.targetGroupId);
                        }
                    });
                    fail('No groupname found!');
                });
            } catch (e) {
                fail(e);
            }
        })
    }

    /**
     * Update Group participants
     * @param groupId
     * @returns {Promise<unknown | void>}
     */
    async getGroupMembers(groupId ) {
        console.log('GroupId: ' + groupId);
        return new Promise(async (succcess, fail) => {
                const chat = await this.client.getChatById(groupId)
                // İştirakçıları əldə etmək və MongoDB-yə yazmaq
                for (const participant of chat.participants) {

                    const existingUser = await Wuser.findOne({ wid: participant.id._serialized });
                    if (!existingUser) {
                        const contact = await this.client.getContactById(participant.id._serialized);
                        const user = new Wuser({
                            wid: participant.id._serialized,
                            name: contact.pushname || contact.name || '',
                            number: participant.id.user,
                            isAdmin: participant.isAdmin,
                            isSA: participant.isSuperAdmin,
                            checkIn: new Date(),
                        });

                        try {
                            await user.save();
                            console.log(`User ${user.name} (${user.number}) saved to MongoDB.`);
                        } catch (err) {
                            console.error('Error saving user to MongoDB:', err);
                        }
                    } else {
                        console.log(`User ${existingUser.name} (${existingUser.number}) already exists in MongoDB.`);
                        existingUser.checkIn = new Date();
                        try {
                            await existingUser.save();
                            console.log(`User ${existingUser.name} (${existingUser.number}) checkIn date updated.`);
                        } catch (err) {
                            console.error('Error updating user in MongoDB:', err);
                        }
                    }
                }
                succcess(true);
            }).catch(err => {
                console.error('Error getting group members:', err);
            });
    }
    // Method to handle incoming messages
    async handleMessage(message) {
        if (message.from === this.targetGroupId) {
            console.log(`Message from target group: ${message.body}`);
            // Process the message here
            this.groupMessagesBySender([
                {
                    fromUserName: message.author,
                    from: message.author,
                    fromUserId: message.author,
                    content: message.body,
                    type: message.type,
                    date: new Date(message.timestamp * 1000),
                    hasAlert: message.body.includes('http'),
                }
            ])
            try {
                // const responseJson = await AI.getChatGPTResponse(message.body);
                // if (responseJson) {
                //     if(responseJson.isElectrician) {
                //         // Retrieve the specific user from the database
                //         const targetWid = '994554736606@c.us';
                //         const mentionedUser = await Wuser.findOne({ wid: targetWid });
                //         const mentionMessage = `[BOT] Bu məsələ ilə əlaqədar @${mentionedUser.number} məşquldur. ${mentionedUser.name} Xahiş dəstək olasan!.`;
                //         message.reply(mentionMessage, undefined, {
                //             mentions: [targetWid]
                //         });
                //     }
                //     else if(responseJson.isTrading) {
                //         // Retrieve the specific user from the database
                //         const targetWid = '994777277750@c.us';
                //         const mentionedUser = await Wuser.findOne({ wid: targetWid });
                //         const mentionMessage = `[BOT] Bu məsələ ilə əlaqədar @${mentionedUser.number} məşquldur. ${mentionedUser.name} Xahiş dəstək olasan!.`;
                //         message.reply(mentionMessage, undefined, {
                //             mentions: [targetWid]
                //         });
                //     }
                //     else if(responseJson.isAdv) {
                //         const targetWid1 = '994554736606@c.us';
                //         const mentionedUser1 = await Wuser.findOne({ wid: targetWid1 });
                //         const targetWid2 = '994554736606@c.us';
                //         const mentionedUser2 = await Wuser.findOne({ wid: targetWid2 });
                //         const mentionMessage = `[BOT] Əziz dost işi evimiz kimi sevdiyimiz qrupumuza gətirməsək əəla olar. Nəzərinə çatdırım ki qrup daxilində Adminlərdən başqa reklam paylaşmaq qadağandır. Əgər paylaşımının reklam xarakterli olmadığını düşünürsənsə onda xahiş edirəm bu barədə Adminlərə məlumat verəsən. @${mentionedUser1.number} @${mentionedUser2.number}`;
                //         message.reply(mentionMessage, undefined, {
                //             mentions: [targetWid1, targetWid2]
                //         });
                //     }
                // }
            } catch (e) {
                console.log(e);
            }
        }
    }
    async getMessages() {
        return new Promise((resolve, reject) => {
            this.client.getChatById(this.targetGroupId).then(chat => {
                chat.fetchMessages({ limit: 500 }).then(messages => {
                    const messageData = messages.filter(message => message._data && message._data.author).map((message, index) => {
                        return {
                            fromUserName: message._data.author.user,
                            from: message._data?.author?.user,
                            fromUserId: message._data.author._serialized,
                            content: message.body,
                            type: message._data.type,
                            date: new Date(message._data.t * 1000), // Convert from seconds to milliseconds
                            hasAlert: message.body.includes('http'),
                        }
                    });
                    resolve(this.groupMessagesBySender(messageData));
                }).catch(err => reject(err));
            }).catch(err => reject(err));
        });
    }

    async groupMessagesBySender(messages) {
        for (const message of messages) {
            const existingMessage = await Message.findOne({ date: message.date, fromUserId: message.fromUserId });

            if (!existingMessage) {
                const user = await Wuser.findOne({ wid: message.fromUserId });

                if (user) {
                    message.fromUserName = user.name || message.fromUserName;
                }

                const newMessage = new Message({
                    fromUserName: message.fromUserName,
                    from: message.from,
                    fromUserId: message.fromUserId,
                    content: message.content,
                    type: message.type,
                    date: message.date,
                    hasAlert: message.hasAlert,
                });

                try {
                    await newMessage.save();
                    console.log(`Message from ${message.fromUserName} saved to MongoDB.`);
                } catch (err) {
                    console.error('Error saving message to MongoDB:', err);
                }
            } else {
                console.log(`Message with UserId ${message.fromUserName} already exists in MongoDB.`);
            }
        }
        return true;
    }
}

// Initialize a new instance of WhatsAppBot
const bot = new WhatsAppBot();
module.exports = bot;