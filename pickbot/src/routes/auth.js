const express = require('express');
const router = express.Router();
const authCtrl = require('../controllers/auth');
router.post('/login', authCtrl.login);
router.post('/signup', authCtrl.signup);
router.get('/logout/:login', authCtrl.logout);
router.delete('/selfremoval/:login', authCtrl.selfremoval);
module.exports = router;
