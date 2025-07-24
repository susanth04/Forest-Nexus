const express = require('express');
const router = express.Router();

const { suggestPet } = require('../controllers/petController');

router.post('/suggest-pet', suggestPet);

module.exports = router;
