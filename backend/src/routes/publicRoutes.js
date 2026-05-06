const express = require('express');
const router = express.Router();
const { getMenu, createOrder } = require('../controllers/publicController');

router.get('/menu', getMenu);
router.post('/orders', createOrder);

module.exports = router;