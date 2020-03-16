var express = require('express');
var router = express.Router();
var multer = require('multer');
const crypto = require('crypto');
var path = require('path');
const fs = require('fs')
const mime = require('mime');

var mStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './files/art/')
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



  // var srcFilename = 'uploaded-office-actions/'+req.body.filename;
  var destFilename = './files/oa/' + req.body.filename;

  // skip downloading from google for now
  // await downloadFile(srcFilename, destFilename).catch(console.error);

  res.sendFile(path.join(__dirname, '../', destFilename))
});

async function downloadFile(src, dest) {
  if (fs.existsSync(dest)) {
    //file exists
    console.log('file exists already, do not dl from goog')
    return
  }
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
  var processedOaEntity = {
    key: datastore.key(['processedOa', oaObject.filename]),
    data: oaObject
  }
  const oaUploadKey = datastore.key(['oaUpload', oaObject.filename]);
  const [oaUploadEntity] = await datastore.get(oaUploadKey);
  oaUploadEntity.processed = true

  await datastore.upsert([processedOaEntity, oaUploadEntity])
  
  res.json(oaObject)
});

router.post('/uploadPa', checkJwt, upload.array('paList'), async function(req, res, next) {
  console.log('----uploaded pa----')
  // var promiseArray = []
  const paObjects = []
  for (var i=0; i<req.files.length; i++) {
    var fileObj = req.files[i]
    paObjects.push({
      pdfUrl: fileObj.path,
      filename: fileObj.filename,
      originalname: fileObj.originalname,
      abbreviation: '', //need these empty fields so elements are controlled on client-side
      publicationNumber: '',
      assignee: '',
      title: '',
      citationList: []
    })
    // promiseArray.push(uploadFileToGoogle(fileObj.destination, fileObj.filename))
  }  
  // skip uploading to google for now
  // let results = await Promise.all(promiseArray)
  console.log(req.files)
  res.json({ 
    // files: req.files,
    paObjects: paObjects
  })    
});

function uploadFileToGoogle(path, filename) {
  console.log(`${filename} uploading to ${bucketName}.`);
  // Uploads a local file to the bucket
  return storage.bucket(bucketName).upload(path + filename, {
    destination: `uploaded-prior-art/${filename}`,
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

module.exports = router;
