var express = require('express');
var router = express.Router();

const { sendContactInfo } = require('../controllers/contactController')



router.get('/', async (req,res) => {
    res.render('contact', {title: 'Contact Us'});   
});

router.post('/', sendContactInfo);   


module.exports = router;
