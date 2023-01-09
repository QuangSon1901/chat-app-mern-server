const mongoose = require('mongoose');

const databaseConnect = () => {
    mongoose.set('strictQuery', false);
    mongoose
        .connect(process.env.DATABASE_URL, {
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
