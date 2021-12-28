var express = require('express');
var router = express.Router();
const {getPositionsByUserId} = require('../controllers/positionsController')
const { requireAuth } = require("../middlewares/authMiddleware");

router.get('/', requireAuth, async (req,res) => {
    res.render('positions', {title: 'Positions'});
});


router.get('/view', requireAuth, getPositionsByUserId);


router.get('*', (req,res) => res.status(404).send('We can not find those positions right now. Try again later.'));

module.exports = router;
