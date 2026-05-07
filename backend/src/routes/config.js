const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { getConfig, getPrompts, setDefaultPrompt, createPrompt, deletePrompt } = require('../controllers/configController');

router.use(authMiddleware);
router.get('/', getConfig);
router.get('/prompts', getPrompts);
router.patch('/prompts/:id/default', setDefaultPrompt);
router.post('/prompts', createPrompt);
router.delete('/prompts/:id', deletePrompt);

module.exports = router;