const User = require('../models/authModel');
const Message = require('../models/messageModel');
const formidable = require('formidable');
const cloudinary = require('cloudinary').v2;

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
    form.parse(req, async (err, fields, files) => {
        const { senderName, receiveId } = fields;

        if (Object.keys(files).length === 0) {
            res.status(400).json({
                error: {
                    errorMessage: ['Please provide image!'],
                },
            });
        }
        if (Object.keys(files).length === 0) {
            const { size, mimetype } = files.image;
            const imageSize = size / 1000 / 1000;
            const imageType = mimetype.split('/')[1];

            if (imageType !== 'png' && imageType !== 'jpg' && imageType !== 'jpeg') {
                res.status(400).json({
                    error: {
                        errorMessage: ['Please provide image!'],
                    },
                });
            } else if (imageSize > 8) {
                res.status(400).json({
                    error: {
                        errorMessage: ['please provide your image less then 8 MB!'],
                    },
                });
            }
        } else {
            cloudinary.config({
                cloud_name: 'dxytonwou',
                api_key: '454662379199425',
                api_secret: 'DRw_xXTr4ss_SdIQqx - kZTMVO5E',
                secure: true,
            });

            try {
                const result = await cloudinary.uploader.upload(files.image.filepath);
                const newData = {
                    senderId,
                    senderName,
                    receiveId,
                    message: {
                        text: '',
                        image: result.url,
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
