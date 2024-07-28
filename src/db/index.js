const mongoose = require('mongoose');
function connectToDB() {
    mongoose.connect(process.env.DB).then(connection => {
        console.log('MongoDB connected successfully')
    })
}

module.exports = connectToDB;