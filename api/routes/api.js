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

//MAKE SURE oaUploads EXISTS ON THE SERVER
var mStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './files/oa/')
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
  console.log('----uploaded oa----')
  // console.log(req.file.destination + req.file.filename)
  let results = await Promise.all([
    // do not upload to google for now
    // uploadFileToGoogle(req.file.destination, req.file.filename),
    insertOaObject({
      user: req.body.userEmail,
      filename: req.file.filename,
      originalname: req.file.originalname,
      uploadTime: Date.now(),
      processed: false
    })])
  const txt = req.body.userEmail + ' uploaded ' + req.file.originalname + " for processing.  Go <a href='https://patentbutler.com/admin'>here</a> to process."
  const data = {
    from: req.body.userEmail,
    to: 'Jon Liu, jon@patentbutler.com',
    subject: 'Uploaded new OA for processing',
    html: txt
  };
  mg.messages().send(data, function (error, body) {
    console.log(body)
    res.json({ filename: req.file.filename })    

  });  
});

const mailgun = require("mailgun-js");
const DOMAIN = 'mail.patentbutler.com';
const api_key = '395890d26aad6ccac5435c933c0933a3-9a235412-6950caab'
const mg = mailgun({apiKey: api_key, domain: DOMAIN});



function uploadFileToGoogle(path, filename) {
  console.log(`${filename} uploading to ${bucketName}.`);
  // Uploads a local file to the bucket
  return storage.bucket(bucketName).upload(path + filename, {
    destination: `uploaded-office-actions/${filename}`,
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
    key: datastore.key(['oaUpload', oaObject.filename]),
    data: oaObject,
  });
};

/* GET home page. */
//need upload.non() to handle POST multipart form
router.post('/home', checkJwt, upload.none(), async function(req, res, next) {
  //get list of datastore objects; get link rdy to show processed OA
  // use req.body.userEmail
  const processingOaQuery = datastore
    .createQuery('oaUpload')
    .filter('user', '=', req.body.userEmail)
    .filter('processed', '=', false)
    .order('uploadTime');

    const finishedOaQuery = datastore
    .createQuery('processedOa')
    .filter('user', '=', req.body.userEmail)
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

router.post('/getProcessedOa', checkJwt, upload.none(), async function(req, res, next) {

  const [entity] = await datastore.get(datastore.key(['processedOa', req.body.filename]));
  console.log(entity)
  res.json(
    {
      processedOa: entity
    })
});

//let people send feedback
router.post('/email', upload.none(), (req, res) => {
  const data = {
    from: req.body.email,
    to: 'Jon Liu, jon@patentbutler.com',
    subject: 'Feedback',
    text: req.body.comment
  };
  mg.messages().send(data, function (error, body) {
    res.json({success: 'done'})

  });  
})


module.exports = router;
