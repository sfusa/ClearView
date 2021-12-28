var express = require('express');
var router = express.Router();

const { requireAuth } = require("../middlewares/authMiddleware");
const { addNewTrans} = require('../controllers/transactionsController');


router.get('/', requireAuth, async (req,res) => {
    res.render('trade', {title: 'Trade'});
});

router.post('/new', requireAuth, addNewTrans);


router.get('*', (req,res) => res.status(404).send('We can not find those trades right now. Try again later.'));

module.exports = router;
