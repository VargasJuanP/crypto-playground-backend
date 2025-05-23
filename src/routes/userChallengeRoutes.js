const express = require('express');
const router = express.Router();
const userChallengeController = require('../controllers/userChallengeController');
const auth = require('../middleware/auth');

router.get('/', auth, userChallengeController.getUserChallenges);
router.get('/stats', auth, userChallengeController.getUserChallengeStats);

module.exports = router;