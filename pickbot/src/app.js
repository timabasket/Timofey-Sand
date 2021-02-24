let express = require('express');
let path = require('path');
let cookieParser = require('cookie-parser');
require('./models/db');
let logger = require('morgan');

let authRouter = require('./routes/auth');
let ppRouter = require('./routes/pp');
let postMode = require('./routes/postMode');

let app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/', express.static(path.join(__dirname, 'public')));

app.use('/api', authRouter);
app.use('/api', ppRouter);
app.use('/api/postmode', postMode);

//The 404 Route
app.get('*', function(req, res){
    res.status = 404;
    res.send('');
});

module.exports = app;
