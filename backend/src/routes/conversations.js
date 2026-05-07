const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const {
  getConversations,
  createConversation,
  getConversation,
  rateConversation,
} = require('../controllers/conversationsController');

// Todas las rutas requieren autenticación
router.use(authMiddleware);

router.get('/', getConversations);
router.post('/', createConversation);
router.get('/:id', getConversation);
router.patch('/:id/rate', rateConversation);

module.exports = router;