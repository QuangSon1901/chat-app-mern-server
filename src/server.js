const express = require('express');
const app = express();
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require('path');
const io = require('socket.io')(8000, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST'],
    },
});

const databaseConnect = require('./config/database.js');
const authRouter = require('./routes/authRoute.js');
const messengerRoute = require('./routes/messengerRoute.js');

const corsOptions = {
    origin: 'http://localhost:3000',
    credentials: true,
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};

app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors(corsOptions));

dotenv.config({
    path: 'src/config/config.env',
});

app.use('/public', express.static(path.join(__dirname, '/public')));
app.use('/api/messenger', authRouter);
app.use('/api/messenger', messengerRoute);

databaseConnect();

let users = [];
const addUser = (userId, socketId, userInfo) => {
    const checkUser = users.some((u) => u.userId === userId);
    if (!checkUser) {
        users.push({
            userId,
            socketId,
            userInfo,
        });
    }
};

const userRemove = (socketId) => {
    users = users.filter((u) => u.socketId !== socketId);
};

const findFriend = (id) => {
    return users.find((u) => u.userId === id);
};

io.on('connection', (socket) => {
    socket.on('addUser', (userId, userInfo) => {
        addUser(userId, socket.id, userInfo);
        io.emit('getUser', users);
    });
    socket.on('sendMessage', (data) => {
        const user = findFriend(data.receiveId);
        if (user !== undefined) {
            socket.to(user.socketId).emit('getMessage', data);
        }
    });
    socket.on('messageSeen', (msg) => {
        const user = findFriend(msg.senderId);
        if (user !== undefined) {
            socket.to(user.socketId).emit('msgSeenResponse', msg);
        }
    });
    socket.on('delivaredMessage', (msg) => {
        const user = findFriend(msg.senderId);
        if (user !== undefined) {
            socket.to(user.socketId).emit('msgDelivaredResponse', msg);
        }
    });
    socket.on('seen', (data) => {
        const user = findFriend(data.senderId);
        if (user !== undefined) {
            socket.to(user.socketId).emit('seenSuccess', data);
        }
    });
    socket.on('typingMessage', (data) => {
        const user = findFriend(data.receiveId);
        if (user !== undefined) {
            socket.to(user.socketId).emit('typingMessageGet', {
                senderId: data.senderId,
                receiveId: data.receiveId,
                msg: data.msg,
            });
        }
    });
    socket.on('disconnect', () => {
        userRemove(socket.id);
        io.emit('getUser', users);
    });
});

const PORT = process.env.APP_PORT || 4000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
