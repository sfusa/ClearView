var express = require('express');
var router = express.Router();

const { requireAuth } = require("../middlewares/authMiddleware");
const { getCashBalanceByUserId, updateUserCash  } = require('../controllers/cashBalanceController')


router.get('/', requireAuth, async (req,res) => {
    res.render('cash', {title: 'Cash'});   
});


router.get('/balance', requireAuth, getCashBalanceByUserId);


router.put('/update', requireAuth, updateUserCash);

module.exports = router;
