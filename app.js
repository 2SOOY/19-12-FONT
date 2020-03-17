const express = require('express');
const multer = require('multer');
const path = require('path');
const ejs = require('ejs');
const morgan = require('morgan');

const indexRouter = require('./routes/index');
const uploadRouter = require('./routes/upload');
const progressRouter = require('./routes/progress');

// 서버 객체 생성
const app = express();

// 서버 세팅 설정
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.set('port', process.env.PORT || 8080);

// 미들웨어 등록
app.use(morgan('dev')); // logging
app.use(express.static(path.join(__dirname, 'public'))); 
// app.use(express.static(path.join(__dirname, 'font_python'))); 


// 라우터 등록
app.use('/', indexRouter);
app.use('/upload', uploadRouter);
app.use('/progress', progressRouter);


// 404 에러 처리
app.use((req, res, next) => {
    res.status(404).send('NOT FOUND');
});

// 500 에러 처리
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send('SERVER ERROR');    
});

app.listen(app.get('port'), () => {
    console.log(`Running at localhost:${app.get('port')}`);
});
