/*
TO DEPLOY TO PROD:
  1. 'npm run build' in /client, 'npm run build' in /admin
  2. Go to /api and run 'gcloud app deploy' 

*/

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var apiRouter = require('./routes/api');
var adminApiRouter = require('./routes/adminApi');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

app.use('/admin', express.static(path.join(__dirname, './admin-build')));
app.use(express.static(path.join(__dirname, './client-build')));

app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

app.use('/adminApi', adminApiRouter)
app.use('/api', apiRouter)

app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname + './admin-build/index.html'))
})

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, './client-build/index.html'));
})


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});


module.exports = app;
