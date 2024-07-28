const mongoose = require("mongoose");
const messageSchema = new mongoose.Schema({
    fromUserName: String,
    from: String,
    content: String,
    date: Date,
    fromUserId: String,
    type: String,
    hasAlert: Boolean,

});

const Message = mongoose.model('messages', messageSchema);

module.exports = Message;