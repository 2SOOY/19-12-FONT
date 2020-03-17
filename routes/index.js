const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
    console.log('INDEX PAGE');
    res.render('index');
});

router.get('/download', (req, res) => {
    res.download('./public/myfont.ttf');
});

module.exports = router;