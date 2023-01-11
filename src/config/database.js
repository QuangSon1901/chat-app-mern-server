const mongoose = require('mongoose');

const databaseConnect = () => {
    mongoose.set('strictQuery', false);
    mongoose
        .connect('mongodb+srv://quangson:x36jbwaiA4ZravEv@cluster0.ytbauk7.mongodb.net/?retryWrites=true&w=majority', {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        })
        .then(() => {
            console.log('MongoDB database connect...');
        })
        .catch((error) => {
            console.log(error);
        });
};

module.exports = databaseConnect;
