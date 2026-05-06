const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { getReports } = require('../controllers/reportController');

router.get('/', protect, authorize('admin', 'staff'), getReports);

module.exports = router;