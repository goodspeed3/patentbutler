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
    excludeFromIndexes: ['textAnnotations', 'rejectionList[].blurb', 'rejectionList[].claimArgumentList[].examinerText', 'rejectionList[].claimArgumentList[].snippetText']
  }
  const oaUploadKey = datastore.key(['oaUpload', oaObject.filename]);
  const [oaUploadEntity] = await datastore.get(oaUploadKey);

  //only email if email not already sent
  if (req.body.sendEmail === 'true') {
    oaUploadEntity.processed = true //only truly processed after sending the email

    console.log('sending email')
    const link = 'https://patentbutler.com/view/'+oaObject.filename
    const maildate = new Date(oaObject.mailingDate)
    var maildateString = ''
    if (!isNaN(maildate)) { //a mailing date exists
      maildateString = ' mailed on ' + (1+maildate.getMonth()) + "/" + maildate.getDate() + "/" + maildate.getFullYear()
    }
    const txt = 'Hello,<br /><br />Our systems have prepared \'' + oaObject.originalname + "\' ("+ oaObject.applicationNumber +") for viewing.  Go <a href='"+link+"'>here</a> to access the PatentButler office action experience.<br /><br />Thanks,<br />The PatentButler team"
    
    const data = {
      from: 'PatentButler Team <team@mail.patentbutler.com>',
      to: oaObject.user,
      subject: 'Your Office Action \'' + oaObject.originalname + '\'' + maildateString + ' has finished processing',
      html: txt,
      "o:tag" : ['finished processing']
    };
    if (oaObject.user.includes("patentbutler")) {
      delete data["o:tag"]
      //don't tag it if me, ruins analytics
    }
    mg.messages().send(data);    
  }
  await datastore.upsert([processedOaEntity, oaUploadEntity])
  res.json({ filename: oaObject.filename })    

});

router.post('/uploadPa', checkJwt, upload.single('file'), async function(req, res, next) {
  console.log('----uploaded pa----')
  const directory = 'uploaded-cited-art/'

  var fileObj = req.file
  const filename = nanoid() + '.pdf'
  const cloudUrl = 'https://storage.googleapis.com/' + bucketName + '/' + directory + filename;
  var response = {
    // pdfUrl: fileObj.path,
    filename: filename,
    originalname: fileObj.originalname,
    cloudUrl: cloudUrl,
  }
  await uploadBuffer(fileObj.originalname, fileObj.buffer, filename, directory)

  res.json({ 
    // files: req.files,
    paObjects: response
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

router.post('/delete', checkJwt, upload.none(), async function(req, res, next) {
  console.log('----deleting----')
  const artDirectory = 'uploaded-cited-art/'
  const oaDirectory = 'uploaded-office-actions/'
  const ocrDirectory = 'ocr/office-actions/'

  try {
    //get all filenames in processedOa Obj
    const processedOaKey = datastore.key(['processedOa', req.body.filename]);
    const [processedOaEntity] = await datastore.get(processedOaKey);

    if (processedOaEntity) {
      //delete all PA 
      for (var i=0; i<processedOaEntity.priorArtList.length; i++) {
        const priorArtObj = processedOaEntity.priorArtList[i]
        const file = storage.bucket(bucketName).file(artDirectory + priorArtObj.filename);
        console.log('deleting art: ' + priorArtObj.filename)
        await file.delete().catch((e) => console.log(e));
      }


      //delete datastore obj
      console.log('deleting processedOa Obj')
      await datastore.delete(processedOaKey).catch((e) => console.log(e));


    }

    //delete OCR
    const options = {
      prefix: ocrDirectory,
    };
  
    // Lists files in the bucket, filtered by a prefix
    const [files] = await storage.bucket(bucketName).getFiles(options);
    for (ocrFile of files) {
      if (ocrFile.name.includes(req.body.filename)) {
        console.log('deleting ocr: ' + ocrFile.name)
        await ocrFile.delete().catch((e) => console.log(e));    
      }
    }
    
    //get all filenames in oaUpload Obj
    const oaUploadKey = datastore.key(['oaUpload', req.body.filename]);
    const [oaUploadEntity] = await datastore.get(oaUploadKey);

    if (oaUploadEntity) {
      //delete OA
      const file = storage.bucket(bucketName).file(oaDirectory + oaUploadEntity.filename);
      console.log('deleting oa: ' + oaUploadEntity.filename)
      await file.delete().catch((e) => console.log(e));

      //delete datastore obj
      console.log('deleting oaUpload Obj')
      await datastore.delete(oaUploadKey).catch((e) => console.log(e));

    }
  } catch (error) {
    console.log(error)
  }

  res.json({success: "true"})

});
const crypto = require('crypto')

const verify = ({ signingKey, timestamp, token, signature }) => {
    const encodedToken = crypto
        .createHmac('sha256', signingKey)
        .update(timestamp.concat(token))
        .digest('hex')

    return (encodedToken === signature)
}

router.post('/mailgun', upload.none(), async function(req, res, next) {
  let verification = {
    signingKey: '395890d26aad6ccac5435c933c0933a3-9a235412-6950caab',
    timestamp: req.body.signature.timestamp,
    token: req.body.signature.token,
    signature: req.body.signature.signature,
  }

  if (verify(verification)) {
    console.log("mailgun verified")

    //query the right table
    var tags = req.body["event-data"].tags
    var table = 'targetedOaRecipients'
    if (tags.some( t => t.includes("cold"))) { //when sending with template, make sure the template is named "cold" somewhere
      table = 'coldEmail'
    } 

    const entityKey = datastore.key([table, req.body["event-data"].recipient]);
    const [entity] = await datastore.get(entityKey);
    if (entity) {
      entity.clientInfo = JSON.stringify(req.body["event-data"]["client-info"])

      if (req.body["event-data"].event === 'opened') {
        entity.numOpens++
        entity.openTime = new Date(req.body["event-data"].timestamp * 1000).toString()
      } else if (req.body["event-data"].event === 'clicked') {
        entity.numClicks++
        entity.urlClicked = req.body["event-data"].url
        entity.clickTime = new Date(req.body["event-data"].timestamp * 1000).toString()
      }
      await datastore.upsert(entity)  
    }
    res.sendStatus(200);
  } else {
    console.log("mailgun not verified")
    res.sendStatus(406);
  }
})


module.exports = router;
