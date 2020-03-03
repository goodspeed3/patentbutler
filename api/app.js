/*
TO DEPLOY TO PROD:
  1. 'npm run build' in /client
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

// app.use(express.static(path.join(__dirname, './public')));
app.use(express.static(path.join(__dirname, './client-build')));

app.use(function(err, req, res, next) {
  if (err.name === "UnauthorizedError") {
    return res.status(401).send({ msg: "Invalid token" });
  }

  next(err, req, res);
});

// app.use('/', indexRouter);
const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
}
// This will hold the users and authToken related to users
const authTokens = {};

app.post('/adminLogin', function (req, res) {
  if(req.body.username === 'renwoshin' && req.body.password === 'renwoshin!') {
    const authToken = generateAuthToken();
    // Store authentication token
    authTokens[authToken] = req.body.username;
    // Setting the auth token in cookies
    res.cookie('AuthToken', authToken);
    res.json({username: 'renwoshin'})
  } else {
    res.status(401)
    res.json({})
  }
})
//middleware to handle admin requests
app.use((req, res, next) => {
  // Get auth token from the cookies
  const authToken = req.cookies['AuthToken'];

  // Inject the user to the request
  req.user = authTokens[authToken];

  next();
});
function checkAdminLogin (req, res, next) {
  if (req.user) {
    next()
  } else {
    console.log('admin error login')
    res.status(401);
    res.json({})
  }
}

app.use('/adminApi', checkAdminLogin, adminApiRouter)
app.use('/api', apiRouter)

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
