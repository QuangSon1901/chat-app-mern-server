const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const databaseConnect = require('./config/database.js');
const authRouter = require('./routes/authRoute.js');

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cors());
app.use(cookieParser());

dotenv.config({
    path: 'src/config/config.env',
});

app.use('/api/messenger', authRouter);

databaseConnect();

const PORT = process.env.APP_PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
