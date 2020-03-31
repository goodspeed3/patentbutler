var express = require('express');
var router = express.Router();
var multer = require('multer');
var path = require('path');
// const fs = require('fs')
// const mime = require('mime');
const nanoid = require('nanoid').nanoid;

const mailgun = require("mailgun-js");
const DOMAIN = 'mail.patentbutler.com';
const api_key = '395890d26aad6ccac5435c933c0933a3-9a235412-6950caab'
const mg = mailgun({apiKey: api_key, domain: DOMAIN});


const upload = multer({ storage: multer.memoryStorage() });

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
  // var destFilename = './files/oa/' + req.body.filename;

  storage
    .bucket(bucketName)
    .file(srcFilename)
    .download(function (err, contents) {
      if (err) {
        throw new Error(err)
      }
      console.log(
        `gs://${bucketName}/${srcFilename} downloaded to memory`
      );
    
      res.send(contents)
    });

});

router.post('/getOaObj', checkJwt, upload.none(), async function(req, res, next) {
  const processedOaKey = datastore.key(['processedOa', req.body.filename]);
  const [processedOaEntity] = await datastore.get(processedOaKey);
  res.json({fileData: processedOaEntity})
});



router.post('/saveOaObject', checkJwt, upload.none(), async function(req, res, next) {
  const oaObject = JSON.parse(req.body.oaObject);
  var processedOaEntity = {
    key: datastore.key(['processedOa', oaObject.filename]),
    data: oaObject,
    excludeFromIndexes: ['textAnnotations']
  }
  const oaUploadKey = datastore.key(['oaUpload', oaObject.filename]);
  const [oaUploadEntity] = await datastore.get(oaUploadKey);
  oaUploadEntity.processed = true

  //only email if email not already sent
  if (req.body.sendEmail === 'true') {
    console.log('sending email')
    const link = 'https://patentbutler.com/view/'+oaObject.filename
    const maildate = new Date(oaObject.mailingDate)
    const txt = 'Hello,<br /><br />Our systems have processed \'' + oaObject.originalname + "\' ("+ oaObject.applicationNumber +") for viewing.  Go <a href='"+link+"'>here</a> to access the PatentButler office action experience.<br /><br />Thanks,<br />The PatentButler team"
    maildateString = (1+maildate.getMonth()) + "/" + maildate.getDate() + "/" + maildate.getFullYear()
    const data = {
      from: 'Team team@patentbutler.com',
      to: oaObject.user,
      subject: 'Your Office Action \'' + oaObject.originalname + '\' mailed on ' + maildateString + ' has finished processing',
      html: txt
    };
    mg.messages().send(data);    
  }
  await datastore.upsert([processedOaEntity, oaUploadEntity])
  res.json({ filename: oaObject.filename })    

});

router.post('/uploadPa', checkJwt, upload.array('paList'), async function(req, res, next) {
  console.log('----uploaded pa----')
  const directory = 'uploaded-cited-art/'

  var promiseArray = []
  const paObjects = []
  for (var i=0; i<req.files.length; i++) {
    var fileObj = req.files[i]
    const filename = nanoid() + '.pdf'
    const cloudUrl = 'https://storage.googleapis.com/' + bucketName + '/' + directory + filename;
    paObjects.push({
      // pdfUrl: fileObj.path,
      filename: filename,
      originalname: fileObj.originalname,
      cloudUrl: cloudUrl,
      abbreviation: '', //need these empty fields so elements are controlled on client-side
      publicationNumber: '',
      assignee: '',
      title: '',
      citationList: []
    })
    promiseArray.push(uploadBuffer(fileObj.originalname, fileObj.buffer, filename, directory))
  }  

  let results = await Promise.all(promiseArray)
  console.log(req.files)
  res.json({ 
    // files: req.files,
    paObjects: paObjects
  })    
});

const uploadBuffer = (originalname, buffer, filename, directory) => {
  return new Promise((resolve, reject) => {
    const blob = storage.bucket(bucketName).file(directory + filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });
  
    blobStream.on('error', err => {
      reject(err);
    });
  
    blobStream.on('finish', () => {
      //make all prior art public
      blob.makePublic(function (err, apiResponse) {
      // The public URL can be used to directly access the file via HTTP.
        resolve({
          originalname: originalname, 
          filename: filename
        })
      })
    });
  
    blobStream.end(buffer);
  
  })
}


// function uploadFileToGoogle(path, filename) {
//   console.log(`${filename} uploading to ${bucketName}.`);
//   // Uploads a local file to the bucket
//   return storage.bucket(bucketName).upload(path + filename, {
//     destination: `uploaded-prior-art/${filename}`,
//     // Support for HTTP requests made with `Accept-Encoding: gzip`
//     gzip: true,
//     // By setting the option `destination`, you can change the name of the
//     // object you are uploading to a bucket.
//     metadata: {
//       // Enable long-lived HTTP caching headers
//       // Use only if the contents of the file will never change
//       // (If the contents will change, use cacheControl: 'no-cache')
//       cacheControl: 'public, max-age=31536000',
//     },
//   });

// }

module.exports = router;
