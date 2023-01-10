const User = require('../models/authModel');
const Message = require('../models/messageModel');
const formidable = require('formidable');
const fs = require('fs');

const getLastMessage = async (myId, fdId) => {
    const msg = await Message.findOne({
        $or: [
            {
                $and: [{ senderId: { $eq: myId } }, { receiveId: { $eq: fdId } }],
            },
            {
                $and: [{ senderId: { $eq: fdId } }, { receiveId: { $eq: myId } }],
            },
        ],
    }).sort({ updatedAt: -1 });

    return msg;
};

module.exports.getFriends = async (req, res) => {
    const myId = req.myId;
    let fnd_msg = [];

    try {
        const friendGet = await User.find({
            _id: { $ne: myId },
        });
        for (let i = 0; i < friendGet.length; i++) {
            let lmsg = await getLastMessage(myId, friendGet[i].id);
            fnd_msg = [
                ...fnd_msg,
                {
                    fndInfo: friendGet[i],
                    msgInfo: lmsg,
                },
            ];
        }
        res.status(200).json({
            success: true,
            friends: fnd_msg,
        });
    } catch (error) {
        res.status(500).json({
            error: { errorMessage: 'Internal server error! ' },
        });
    }
};

module.exports.messageUploadDB = async (req, res) => {
    const { senderName, receiveId, message } = req.body;
    const senderId = req.myId;

    try {
        const newData = {
            senderId,
            senderName,
            receiveId,
            message: {
                text: message,
                image: '',
            },
        };
        const insertMessage = await Message.create(newData);

        res.status(201).json({
            success: true,
            message: insertMessage,
        });
    } catch (error) {
        res.status(500).json({
            error: { errorMessage: 'Internal server error!' },
        });
    }
};

module.exports.messageGet = async (req, res) => {
    const myId = req.myId;
    const fdId = req.params.id;

    try {
        let getAllMessage = await Message.find({
            $or: [
                {
                    $and: [{ senderId: { $eq: myId } }, { receiveId: { $eq: fdId } }],
                },
                {
                    $and: [{ senderId: { $eq: fdId } }, { receiveId: { $eq: myId } }],
                },
            ],
        });

        res.status(200).json({
            success: true,
            message: getAllMessage,
        });
    } catch (error) {
        res.status(500).json({
            error: { errorMessage: 'Internal server error!' },
        });
    }
};

module.exports.imageMessageSend = async (req, res) => {
    const senderId = req.myId;
    const form = formidable();
    form.parse(req, (err, fields, files) => {
        const { senderName, receiveId, imageName } = fields;
        const newPath = __dirname + `../../public/uploads/${imageName}`;

        files.image.originalFilename = imageName;

        try {
            fs.copyFile(files.image.filepath, newPath, async (err) => {
                if (err) {
                    res.status(500).json({
                        error: { errorMessage: 'Image upload fail!' },
                    });
                } else {
                    const newData = {
                        senderId,
                        senderName,
                        receiveId,
                        message: {
                            text: '',
                            image: files.image.originalFilename,
                        },
                    };

                    const insertMessage = await Message.create(newData);
                    res.status(201).json({
                        success: true,
                        message: insertMessage,
                    });
                }
            });
        } catch (error) {
            res.status(500).json({
                error: { errorMessage: error },
            });
        }
    });
};

module.exports.messageSeen = async (req, res) => {
    const messageId = req.body._id;

    await Message.findByIdAndUpdate(messageId, { status: 'seen' })
        .then(() => {
            res.status(200).json({
                success: true,
            });
        })
        .catch(() => {
            res.status(500).json({
                error: { errorMessage: error },
            });
        });
};

module.exports.messageDelivared = async (req, res) => {
    const messageId = req.body._id;

    await Message.findByIdAndUpdate(messageId, { status: 'delivared' })
        .then(() => {
            res.status(200).json({
                success: true,
            });
        })
        .catch(() => {
            res.status(500).json({
                error: { errorMessage: error },
            });
        });
};
