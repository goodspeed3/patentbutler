var express = require('express');
var router = express.Router();
var crypto = require('crypto')
// app.use('/', indexRouter);
const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
}
// This will hold the users and authToken related to users
const authTokens = {};

router.post('/login', function (req, res) {
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

function checkAdminLogin (req, res, next) {
  const authToken = req.cookies['AuthToken'];
  // Inject the user to the request
  req.user = authTokens[authToken];
  if (req.user) {
    next()
  } else {
    console.log('admin error login')
    res.status(401);
    res.json({})
  }
}


/* GET users listing. */
router.get('/', checkAdminLogin, function(req, res, next) {
  console.log('hiii')
});

module.exports = router;
