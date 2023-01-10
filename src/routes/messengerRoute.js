const router = require('express').Router();
const {
    getFriends,
    messageUploadDB,
    messageSeen,
    messageGet,
    imageMessageSend,
    messageDelivared,
} = require('../controller/messengerController.js');
const { authMiddleware } = require('../middleware/authMiddleware.js');

router.get('/get-friends', authMiddleware, getFriends);
router.post('/send-message', authMiddleware, messageUploadDB);
router.get('/get-message/:id', authMiddleware, messageGet);
router.post('/image-message-send', authMiddleware, imageMessageSend);
router.post('/seen-message', authMiddleware, messageSeen);
router.post('/delivared-message', authMiddleware, messageDelivared);

module.exports = router;
