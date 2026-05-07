const express = require('express');
const router = express.Router();
const authMiddleware = require('../middlewares/auth');
const { getAnalytics, getSummary } = require('../controllers/analyticsController');

router.use(authMiddleware);
router.get('/summary', getSummary);
router.get('/', getAnalytics);

module.exports = router;