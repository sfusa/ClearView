var express = require('express');
var router = express.Router();


router.get('/', async (req,res) => {
    res.render('articles', {title: 'Articles'});   
});

module.exports = router;
