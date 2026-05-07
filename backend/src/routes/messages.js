const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { getMessages } = require('../controllers/messagesController');

router.use(authMiddleware);
router.get('/:conversationId', getMessages);

module.exports = router;