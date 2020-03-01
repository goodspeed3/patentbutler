var express = require('express');
var router = express.Router();
var multer = require('multer');
const crypto = require('crypto');
const mime = require('mime');

const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

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


// Set up Auth0 configuration
const authConfig = {
  domain: "dev-patentbutler.auth0.com",
  audience: "https://patentbutler.com/api"
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


/* GET home page. */
router.post('/home', checkJwt, function(req, res, next) {
  //get list of datastore objects; get link rdy to show processed OA
  // use req.body.userEmail
  res.json({ list: [
    {
      hi: 'ho'
    }
  ] })
});
var mStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads/')
  },
  filename: function (req, file, cb) {
    crypto.pseudoRandomBytes(16, function (err, raw) {
      cb(null, raw.toString('hex') + Date.now() + '.' + mime.getExtension(file.mimetype));
    });
  }
});

const upload = multer({ storage: mStorage });
/* POST upload OA. */
router.post('/upload', checkJwt, upload.single('file'), async function(req, res, next) {
  let results = await Promise.all([
    uploadFile(req.file.destination + req.file.filename),
    insertOaObject({
      user: req.body.userEmail,
      filename: req.file.filename,
      uploadTime: Date.now()
    })])
  res.json({ filename: req.file.filename })    
  
});


function uploadFile(filename) {
  console.log(`${filename} uploading to ${bucketName}.`);
  // Uploads a local file to the bucket
  return storage.bucket(bucketName).upload(filename, {
    // Support for HTTP requests made with `Accept-Encoding: gzip`
    gzip: true,
    // By setting the option `destination`, you can change the name of the
    // object you are uploading to a bucket.
    metadata: {
      // Enable long-lived HTTP caching headers
      // Use only if the contents of the file will never change
      // (If the contents will change, use cacheControl: 'no-cache')
      cacheControl: 'public, max-age=31536000',
    },
  });

}

/**
 * Insert a visit record into the database.
 *
 * @param {object} visit The visit record to insert.
 */
const insertOaObject = oaObject => {
  console.log("saving to datastore: ")
  console.log(oaObject);
  return datastore.save({
    key: datastore.key('oaUpload'),
    data: oaObject,
  });
};



module.exports = router;
