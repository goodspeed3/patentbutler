var express = require('express');
var router = express.Router();
var multer = require('multer');
const crypto = require('crypto');
var path = require('path');

var mStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/art/')
  },
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      cb(null, raw.toString('hex') + Date.now() + '.' + mime.getExtension(file.mimetype));
    });
  }
});

const upload = multer({ storage: mStorage });

var jwt = require('express-jwt');
const jwksRsa = require("jwks-rsa");
// Set up Auth0 configuration
const authConfig = {
  domain: "dev-patentbutler.auth0.com",
  audience: 'https://patentbutler.com/adminApi',
};

// Define middleware that validates incoming bearer tokens
// using JWKS from dev-patentbutler.auth0.com
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://${authConfig.domain}/.well-known/jwks.json`
  }),

  audience: authConfig.audience,
  issuer: `https://${authConfig.domain}/`,
  algorithm: ["RS256"]
});

//need to write to Firestore (noSQL) and also store file in cloud storage (Firestore in Datastore mode)
const {Storage} = require('@google-cloud/storage');
// Instantiates a client. Explicitly use service account credentials by
// specifying the private key file. All clients in google-cloud-node have this
// helper, see https://github.com/GoogleCloudPlatform/google-cloud-node/blob/master/docs/authentication.md
const projectId = 'crafty-valve-269403'
const keyFilename = './crafty-valve-269403-438cf61af1ed.json'
const storage = new Storage({projectId, keyFilename});
const bucketName = 'crafty-valve-269403.appspot.com';
const {Datastore} = require('@google-cloud/datastore');

// Instantiate a datastore client
const datastore = new Datastore({projectId, keyFilename});




router.post('/home', checkJwt, upload.none(), async function(req, res, next) {
  //get list of datastore objects; get link rdy to show processed OA
  // use req.body.userEmail
  const processingOaQuery = datastore
    .createQuery('oaUpload')
    .filter('processed', '=', false)
    .order('uploadTime');

    const finishedOaQuery = datastore
    .createQuery('processedOa')
    .order('finishedProcessingTime');
    

  let results = await Promise.all([
    datastore.runQuery(processingOaQuery),
    datastore.runQuery(finishedOaQuery),    
    ])

  res.json(
    {
      processingOa: results[0], //order is preserved
      finishedOa: results[1]  
    })
});

//download uploaded office action
router.post('/downloadOa', checkJwt, upload.none(), async function(req, res, next) {



  var srcFilename = 'uploaded-office-actions/'+req.body.filename;
  var destFilename = './downloads/oa/' + req.body.filename;

  //uncomment for prod!!
  // await downloadFile(srcFilename, destFilename).catch(console.error);

  res.sendFile(path.join(__dirname, '../', destFilename))
});

async function downloadFile(src, dest) {
  const options = {
    // The path to which the file should be downloaded, e.g. "./file.txt"
    destination: dest,
  };

  // Downloads the file
  await storage
    .bucket(bucketName)
    .file(src)
    .download(options);

  console.log(
    `gs://${bucketName}/${src} downloaded to ${dest}.`
  );
}

router.post('/saveOaObject', checkJwt, upload.none(), async function(req, res, next) {
  const oaObject = JSON.parse(req.body.oaObject);
  var entity = {
    key: datastore.key(['processedOa', oaObject.filename]),
    data: oaObject
  }

  await datastore.upsert(entity)
  
  res.json(oaObject)
  // var srcFilename = 'uploaded-office-actions/'+req.body.filename;
  // var destFilename = './downloads/oa/' + req.body.filename;

  // await downloadFile(srcFilename, destFilename).catch(console.error);

  // res.sendFile(path.join(__dirname, '../', destFilename))
});

module.exports = router;
