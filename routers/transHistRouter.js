var express = require('express');
var router = express.Router();

const { getTransactionsByUserId } = require('../controllers/transactionsController')
const { requireAuth } = require("../middlewares/authMiddleware");


router.get('/', requireAuth, async (req,res) => {
    res.render('transactions', {title: 'Transaction History'});
});


router.get('/view', requireAuth, getTransactionsByUserId);


module.exports = router;
