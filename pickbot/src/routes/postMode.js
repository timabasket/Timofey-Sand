var express = require('express');
var router = express.Router();
const authCtrl = require('../controllers/auth');
const ppCtrl = require('../controllers/pp');
router.post('/selfremoval/:login', authCtrl.selfremoval);
router.post('/pp', ppCtrl.ppCreateUpload);
router.post('/pp/:id', ppCtrl.ppDelete);
module.exports = router;