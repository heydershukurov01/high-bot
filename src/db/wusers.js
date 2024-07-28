const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
    name: String,
    number: String,
    wid: String,
    isAdmin: Boolean,
    isSA: Boolean,
    checkIn: Date,
});

const Wuser = mongoose.model('wusers', userSchema);

module.exports = Wuser;