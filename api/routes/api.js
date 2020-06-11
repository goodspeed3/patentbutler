var express = require('express');
var router = express.Router();
var multer = require('multer');
// const mime = require('mime');
const nanoid = require('nanoid').nanoid;
const diff = require("deep-object-diff").diff;

var stripe_creds = {};
if (process.env.NODE_ENV === 'production') {
  //replace me when LLC formed
  stripe_creds.API = 'pk_live_qGizdKkW4i1TlXo6algrnBFa00Poy9FSWl'
  stripe_creds.SECRET = 'sk_live_6LZ8nKG8v1bX8HFDH19tsgwc009mYJTJ2p'
  stripe_creds.SUBPLAN = 'plan_GwW9xGjYtQKbWF'
} else {
  stripe_creds.API = 'pk_test_MpfoAn9oikhl3tdNNjWebiuL00wv0FMfKP'
  stripe_creds.SECRET = 'sk_test_BFhRgj2bHzK53Gw86OIEHyOb00ImoOsA2Q'
  stripe_creds.SUBPLAN = 'plan_H6uQ5vOCcAs0wn'
  stripe_creds.SUBENTERPRISEPLAN = 'plan_HDhPBo8UV07kJw'
}

const stripe = require('stripe')(stripe_creds.SECRET);

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

//why is this being ignored
// var mStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     cb(null, './tmp/') 
//   },
//   filename: function (req, file, cb) {
//     crypto.pseudoRandomBytes(16, function (err, raw) {
//       cb(null, raw.toString('hex') + Date.now() + '.' + mime.getExtension(file.mimetype));
//     });
//   }
// });

const upload = multer({ storage: multer.memoryStorage() });
/* POST upload OA. */

const uploadBuffer = (originalname, buffer) => {
  const directory = 'uploaded-office-actions/'
  return new Promise((resolve, reject) => {
    const filename = nanoid() + '.pdf'
    const blob = storage.bucket(bucketName).file(directory + filename);
    const blobStream = blob.createWriteStream({
      resumable: false,
    });
  
    blobStream.on('error', err => {
      reject(err);
    });
  
    blobStream.on('finish', () => {
      // The public URL can be used to directly access the file via HTTP.
      const cloudUrl = 'https://storage.googleapis.com/' + bucketName + '/' + blob.name;
      resolve({
        cloudUrl: cloudUrl, 
        originalname: originalname, 
        filename: filename
      })
    });
  
    blobStream.end(buffer);
  
  })
}


router.post('/upload', checkJwt, upload.single('file'), async function(req, res, next) {
  if (!req.file) {
    res.status(400).send('No file uploaded.');
    return;
  }  



  //decrease credits and increase processed
  const userKey = datastore.key(['user', req.body.userEmail]);
  var [userEntity] = await datastore.get(userKey);
  userEntity.numOaProcessed = userEntity.numOaProcessed + 1
  if (userEntity.oaCredits <= 0) {
    if (!userEntity.customerId && !userEntity.perUserPlan) {
      console.log('no credits to continue')
      res.json({ error: 'need to add payment'})
      return  
    } else if (userEntity.perUserPlan) {
      console.log('part of monthly plan')
    } else {
      await stripe.subscriptionItems.createUsageRecord(
        userEntity.subscriptionItemId,
        {
          quantity: 1,
          timestamp: Math.ceil(Date.now() / 1000),
          action: "increment"
        }
      );
      
    }
  }
  if (userEntity.oaCredits > 0)
    userEntity.oaCredits = userEntity.oaCredits - 1

  console.log('----uploading to cloud----')

  // Create a new blob in the bucket and upload the file data to Google CLoud.
  uploadBuffer(req.file.originalname, req.file.buffer).then(({cloudUrl, originalname, filename}) => {

    const txt = req.body.userEmail + ' uploaded ' + req.file.originalname + " for processing.  Go <a href='https://patentbutler.com/admin'>here</a> to process."
    const data = {
      from: req.body.userEmail,
      to: 'Jon Liu, jon@patentbutler.com',
      subject: 'Uploaded new OA for processing',
      html: txt,
    };

    return Promise.all([
      datastore.upsert(userEntity),
      insertOaObject({
        user: req.body.userEmail,
        cloudUrl: cloudUrl,
        filename: filename,
        originalname: originalname,
        uploadTime: Date.now(),
        processed: false
      }),
      insertProcessedOaObject({
        user: req.body.userEmail,
        filename: filename,
        originalname: originalname,
        rejectionList: [],
        priorArtList: []
      }),
      mg.messages().send(data)
    ])
  }).then(r => {
    res.json({ originalname: req.file.originalname })    

  });

});

const mailgun = require("mailgun-js");
const DOMAIN = 'mail.patentbutler.com';
const api_key = '395890d26aad6ccac5435c933c0933a3-9a235412-6950caab'
const mg = mailgun({apiKey: api_key, domain: DOMAIN});


/**
 * Insert a visit record into the database.
 *
 * @param {object} visit The visit record to insert.
 */
const insertOaObject = oaObject => {
  return datastore.save({
    key: datastore.key(['oaUpload', oaObject.filename]),
    data: oaObject,
  });
};
const insertProcessedOaObject = processedOaObject => {
  return datastore.save({
    key: datastore.key(['processedOa', processedOaObject.filename]),
    data: processedOaObject,
  });
};

/* GET home page. */
//need upload.non() to handle POST multipart form
router.post('/home/oa', checkJwt, upload.none(), async function(req, res, next) {
  var promiseArray = []
  //get list of datastore objects; get link rdy to show processed OA
  // use req.body.userEmail
  const processingOaQuery = datastore
    .createQuery('oaUpload')
    .select(['filename', 'uploadTime', 'originalname'])
    .filter('user', '=', req.body.userEmail)
    .filter('processed', '=', false)
    .order('uploadTime');

    const finishedOaQuery = datastore
    .createQuery('processedOa')
    .select(['filename', 'finishedProcessingTime', 'attyDocket', 'forDemo', 'mailingDate'])
    .filter('user', '=', req.body.userEmail)
    .order('finishedProcessingTime', {descending: true});

    promiseArray.push(datastore.runQuery(processingOaQuery))
    promiseArray.push(datastore.runQuery(finishedOaQuery))


    //if no user yet, create one
    const userKey = datastore.key(['user', req.body.userEmail]);
    var [userEntity] = await datastore.get(userKey);
    // console.log(userEntity)
    if (!userEntity) { //save if new user
      promiseArray.push(addUser(req.body.userEmail))
    }


    
  let results = await Promise.all(promiseArray)
  var responseObj = {
    processingOa: results[0], //order is preserved
    finishedOa: results[1]
  }
    if (promiseArray.length === 3) {
      responseObj.user = results[2]
    } else {
      responseObj.user = userEntity
    }
    // console.log(responseObj)
  res.json(responseObj)
});

router.post('/getProcessedOa', checkJwt, upload.none(), async function(req, res, next) {

  const [entity] = await datastore.get(datastore.key(['processedOa', req.body.filename]));
  // console.log(entity)
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
    html: 'Sent from: ' + req.body.path + '<br /><br />' + req.body.comment
  };
  mg.messages().send(data, function (error, body) {
    var response = {success: 'done'}
    if (error) {
      response = {error: error}
    }
    res.json(response)

  });  
})

const addUser = async (email) => {
  var listOfFreeDomains = ["gmail.com", "yahoo.com", "hotmail.com", "aol.com", "outlook.com"]
  var firmData = listOfFreeDomains.includes(email.split("@")[1]) ? email : email.split("@")[1]
  var data = {
    createdDate: Date.now(),
    oaCredits: 1, //give every new user a free OA
    numOaProcessed: 0,
    firm: firmData
  }
  const mailData = {
    from: email,
    to: 'Jon Liu, jon@patentbutler.com',
    subject: email + ' has just signed up',
    html: 'success!',
  };
  mg.messages().send(mailData, function (error, body) {
    if (error) {
      console.log(error)
    }
    if (body) {
      console.log(body)
    }


  });  
  return datastore.save({
    key: datastore.key(['user', email]),
    data: data
  }).then(r => data);

}

router.post('/user', checkJwt, upload.none(), async function(req, res, next) {

  const userKey = datastore.key(['user', req.body.userEmail]);
  var [userEntity] = await datastore.get(userKey);
  // console.log(userEntity)
  if (!userEntity) { //save if new user
    let data = await addUser(req.body.userEmail)
    res.json({ user: data })    
    return
  }
  res.json({ user: userEntity })    

});
router.post('/handleCustomer', checkJwt, upload.none(), async function(req, res, next) {
  const userKey = datastore.key(['user', req.body.email]);
  var [userEntity] = await datastore.get(userKey);

  if (req.body.action === 'updateCard') {
    await stripe.paymentMethods.attach(
      req.body.payment_method,
      {customer: userEntity.customerId}
    );
  } else if (req.body.action === 'removeCard') {
    await stripe.subscriptions.del(
      userEntity.subscriptionId, {
        invoice_now: true
      }
    );
    userEntity.customerId = null;
    userEntity.last4 = null;
    userEntity.subscriptionId = null;
    userEntity.subscriptionItemId = null;
  } else if (!userEntity.customerId) {
    const customer = await stripe.customers.create({
      payment_method: req.body.payment_method,
      email: req.body.email,
      invoice_settings: {
        default_payment_method: req.body.payment_method,
      },
    });  
    userEntity.customerId = customer.id; //store customer id in our db
  }
  userEntity.last4 = req.body.last4;


  var subscription
  if (!userEntity.subscriptionId && req.body.action !== 'removeCard') {
     subscription = await stripe.subscriptions.create({
      customer: userEntity.customerId,
      items: [{ plan: stripe_creds.SUBPLAN }],
      expand: ["latest_invoice.payment_intent"]
    });  
    userEntity.subscriptionId = subscription.id
    userEntity.subscriptionItemId = subscription.items.data[0].id
  } else if (userEntity.subscriptionId && req.body.action !== 'removeCard') {
    subscription = await stripe.subscriptions.retrieve(userEntity.subscriptionId);
  }
  await datastore.upsert(userEntity)



  res.json({ 
    subscription: subscription,
    user: userEntity
  })    

});

router.post('/demo', upload.none(), async (req, res) => {
  //get demo oa stuff
  const [entity] = await datastore.get(datastore.key(['processedOa', req.body.filename]));
  res.json(
    {
      processedOa: entity
    })
  

})

//serve uploaded office action
router.get('/get/:type/:filename', async function(req, res, next) {
  var srcFilename;
  if (req.params.type === 'oa') {
    srcFilename = 'uploaded-office-actions/'+req.params.filename;
  } else if (req.params.type === 'pa') {
    srcFilename = 'uploaded-cited-art/'+req.params.filename;
  }
  
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
      res.contentType("application/pdf");
      res.send(contents)
    });

});


router.post('/home/ids', checkJwt, upload.none(), async function(req, res, next) {
  var promiseArray = []
  //get list of datastore objects; get link rdy to show processed OA
  // use req.body.userEmail
  const idsQuery = datastore
    .createQuery('clientMatter')
    // .select(['filename', 'uploadTime', 'originalname'])
    // .filter('user', '=', req.body.userEmail)
    .order('createdDate', { descending: true });


    promiseArray.push(datastore.runQuery(idsQuery))


    //if no user yet, create one
    const userKey = datastore.key(['user', req.body.userEmail]);
    var [userEntity] = await datastore.get(userKey);
    // console.log(userEntity)
    if (!userEntity) { //save if new user
      promiseArray.push(addUser(req.body.userEmail))
    }


    
  let results = await Promise.all(promiseArray)
  var responseObj = {
    list: results[0] //order is preserved
  }
    if (promiseArray.length === 2) {
      responseObj.user = results[1]
    } else {
      responseObj.user = userEntity
    }
  res.json(responseObj)
});

router.post('/home/ids/create', checkJwt, upload.none(), async function(req, res, next) {
  var data = {
    createdDate: Date.now(),
    attyDocket: req.body.attyDocket,
    email: req.body.userEmail,
    firm: req.body.userFirm,
    idsData: {           
      usPatents: [] ,
      foreignPatents: [],
      nonPatentLiterature: [] 
    },
    idsSync: [],
    metadata: {            
    }
  }

  try {
    const idsQuery = datastore
    .createQuery('clientMatter')
    .filter('attyDocket', '=', req.body.attyDocket)
    .filter('firm', '=', req.body.userFirm)
    let result = await datastore.runQuery(idsQuery)

    if (result[0].length === 0) {
      //attorney docket yet exist, insert into the db
      await datastore.insert({
        key: datastore.key('clientMatter'),
        data: data
      })

      const idsListQuery = datastore
      .createQuery('clientMatter')  
      .order('createdDate', {descending: true})
      let listResult = await datastore.runQuery(idsListQuery)
      res.json({list: listResult})  

    } else {
      errorMsg = `'${req.body.attyDocket}' exists for your firm.  Please enter a unique attorney docket ID.`
      res.json({error: errorMsg})  
    }

  } catch (e) {
    var errorMsg=''
    console.log(e)
    errorMsg = 'Unknown error.  Please email team@patentbutler.com for assistance.'
    res.json({error: errorMsg})
  }

});

router.post('/idsMatter', checkJwt, upload.none(), async function(req, res, next) {
  const userKey = datastore.key(['user', req.body.userEmail]);
  var [userEntity] = await datastore.get(userKey);

  var promiseArray = []

  const idsQuery = datastore
  .createQuery('clientMatter')
  .filter('attyDocket', '=', req.body.attyDocket)
  .filter('firm', '=', userEntity.firm)
  promiseArray.push(datastore.runQuery(idsQuery))

  const firmDataQuery = datastore
  .createQuery('clientMatter')
  .select(['attyDocket'])
  .filter('firm', '=', userEntity.firm)  
  promiseArray.push(datastore.runQuery(firmDataQuery))

  let results = await Promise.all(promiseArray)
  if (results[0][0].length === 0) {
    res.json({error: 'Error: Attorney Docket not found.'})
  } else {
    var responseObj = {
      attyDocket: results[0][0][0],
      user: userEntity,
      firmData: results[1][0]
    }
    res.json(responseObj)

  }

});

router.post('/updateIdsMatter', checkJwt, upload.none(), async function(req, res, next) {

  var updatedMatterData = JSON.parse(req.body.idsMatterData)
  const idsQuery = datastore
  .createQuery('clientMatter')
  .filter('attyDocket', '=', updatedMatterData.attyDocket)
  .filter('firm', '=', updatedMatterData.firm)
  let result = await datastore.runQuery(idsQuery)
  if (result[0].length === 0) {
    res.json({error: 'Error: Attorney Docket not found.'})
  } else {
    const updatedMatterEntity = {
      key: result[0][0][datastore.KEY],
      data: updatedMatterData,
      excludeFromIndexes: ['idsData']
    };
    // console.log(updatedMatterEntity.data.idsData)
    await datastore.upsert(updatedMatterEntity)

    await syncIds(result[0][0].idsSync, result[0][0].idsData, updatedMatterData)
    // await Promise.all(promisesToExecute)
    res.json({
      success: true
    })

  }
});
async function syncIds(startingIdsSync = [], oldIdsData, updatedMatterData) {
  //get diff of oldIdsData and updatedMatterData; apply diff to the relatedIDS
  var diffMatter = diff(oldIdsData, updatedMatterData.idsData)
  var changeObj = {} //keys are row ids that have changed, values are the changes
  var trackAddedRow = {}
  console.log(diffMatter)

  for (let artType in diffMatter) {
    for (let rowChangeIndex in diffMatter[artType]) {
      const updatedRowObj = updatedMatterData.idsData[artType][rowChangeIndex]
      changeObj[updatedRowObj.id] = diffMatter[artType][rowChangeIndex]
      for (let relatedIds of startingIdsSync) {
        trackAddedRow[relatedIds] = {}
        trackAddedRow[relatedIds][updatedRowObj.id] = false
      }
    }
  }
  console.log(changeObj)
  var promiseArray = []

  //for each matter in idssync, sync idsdata
  for (let relatedIds of startingIdsSync) {
    var relatedIdsQuery = datastore
    .createQuery('clientMatter')
    .filter('firm', '=', updatedMatterData.firm)  
    .filter('attyDocket', '=', relatedIds)
    promiseArray.push(datastore.runQuery(relatedIdsQuery))
  }
  try {
    

    let results = await Promise.all(promiseArray)
    let rowIdList = Object.keys(changeObj)
    for (let result of results) {

      var relatedIdsEntity = result[0][0]
      for (let artType in relatedIdsEntity.idsData) {
        for (let rowObj of relatedIdsEntity.idsData[artType]) {
          if (rowIdList.includes(rowObj.id)) {
            //should update all changed fields in this obj
            for (let changedProperty in changeObj[rowObj.id]) {
              rowObj[changedProperty] = changeObj[rowObj.id][changedProperty]
            }
            //update tracker
            trackAddedRow[relatedIdsEntity.attyDocket][rowObj.id] = true
          }
        }
        // if there are any false variables, then we should add a row
        for (let rowObjId in trackAddedRow[relatedIdsEntity.attyDocket]) {
          let rowInUpdatedMatter = updatedMatterData.idsData[artType].find(e => e.id === rowObjId)
          if (!trackAddedRow[relatedIdsEntity.attyDocket][rowObjId] && rowInUpdatedMatter) {
            console.log(`${rowObjId} not found, adding row to ${relatedIdsEntity.attyDocket} ${artType}`)
            //get row of updatedMatterData and insert it here
            relatedIdsEntity.idsData[artType].push(rowInUpdatedMatter)
          }
        }

      }
      // relatedIdsEntity.idsData = addIdsFromSrcToDest(updatedMatterData, relatedIdsEntity)
      var updatedRelatedMatterEntity = {
        key: relatedIdsEntity[datastore.KEY],
        data: relatedIdsEntity,
        excludeFromIndexes: ['idsData']
      };
      
      await datastore.upsert(updatedRelatedMatterEntity)
  
    }
  
  } catch (e) {
    console.log(e)
  }
  // startingIdsSync = startingIdsSync.filter(e => mattersQueried.indexOf(e) == -1 ? true : false)

}
function citeContainsText(obj) {
  var keys = Object.keys(obj)
  for (var key of keys) {
    if (key !== "id" && typeof obj[key] === 'string' && obj[key].length > 0) {
      return true
    }
  }
  return false
}

//returns updated idsData for destination
const addIdsFromSrcToDest = (srcDocketEntity, destDocketEntity) => {
  //check whether any src docket idsMatter stuff already exists in the dest before adding
  //go through usPatents
  if (srcDocketEntity.idsData.usPatents) {
    srcDocketEntity.idsData.usPatents = srcDocketEntity.idsData.usPatents.filter((e) => citeContainsText(e))
    destDocketEntity.idsData.usPatents = destDocketEntity.idsData.usPatents.filter((e) => citeContainsText(e))

    for (var srcRow of srcDocketEntity.idsData.usPatents) {
      if (destDocketEntity.idsData.usPatents.every((e) => {
        // console.log(`us src: ${srcRow.usDocNumber}, dst: ${e.usDocNumber}, usdocnum does not match: ${e.usDocNumber !== srcRow.usDocNumber} & usdocpubdate does not match: ${e.usDocPubDate !== srcRow.usDocPubDate} & usdocname doesn't match: ${e.usDocName !== srcRow.usDocName} & usdocnotes doesn't match: ${e.usDocNotes !== srcRow.usDocNotes}`)
        return (e.usDocNumber !== srcRow.usDocNumber || e.usDocPubDate !== srcRow.usDocPubDate || e.usDocName !== srcRow.usDocName || e.usDocNotes !== srcRow.usDocNotes)
      })) { //make sure src is not added already
        // console.log(`adding uspatent ${srcRow.usDocNumber} to ${destDocketEntity.attyDocket}`)
        destDocketEntity.idsData.usPatents.push({...srcRow, src: srcDocketEntity.attyDocket, cited: false})
      } else {
        // console.log(`skipping uspatent ${srcRow.usDocNumber}, already exists in ${destDocketEntity.attyDocket}`)
      }
    }
  }

  //go through foreignPatents
  if (srcDocketEntity.idsData.foreignPatents) {
    srcDocketEntity.idsData.foreignPatents = srcDocketEntity.idsData.foreignPatents.filter((e) => citeContainsText(e))
    destDocketEntity.idsData.foreignPatents = destDocketEntity.idsData.foreignPatents.filter((e) => citeContainsText(e))

    for (var srcRow of srcDocketEntity.idsData.foreignPatents) {
      if (destDocketEntity.idsData.foreignPatents.every((e) => {
        // console.log(`foreign src: ${srcRow.foreignDocNumber}, dst: ${e.foreignDocNumber}, foreigndocnum doesn't match: ${e.foreignDocNumber !== srcRow.foreignDocNumber} & foreignpubdate deosn't match: ${e.foreignDocPubDate !== srcRow.foreignDocPubDate} & foreigndocname doesn't match: ${e.foreignDocName !== srcRow.foreignDocName} & foreigndocnotes doesn't match: ${e.foreignDocNotes !== srcRow.foreignDocNotes}`)

        return e.foreignDocNumber !== srcRow.foreignDocNumber || e.foreignDocPubDate !== srcRow.foreignDocPubDate || e.foreignDocName !== srcRow.foreignDocName || e.foreignDocNotes !== srcRow.foreignDocNotes
      })) { //make sure src is not added already
        // console.log(`adding foreignnum ${srcRow.foreignDocNumber} to ${destDocketEntity.attyDocket}`)
        destDocketEntity.idsData.foreignPatents.push({...srcRow, src: srcDocketEntity.attyDocket, cited: false})
      } else {
        // console.log(`skipping foreignnum ${srcRow.foreignDocNumber}, already exists in ${destDocketEntity.attyDocket}`)

      }
    }

  }



  //go through nonPatentLiterature
  if (srcDocketEntity.idsData.nonPatentLiterature) {
    srcDocketEntity.idsData.nonPatentLiterature = srcDocketEntity.idsData.nonPatentLiterature.filter((e) => citeContainsText(e))
    destDocketEntity.idsData.nonPatentLiterature = destDocketEntity.idsData.nonPatentLiterature.filter((e) => citeContainsText(e))

    for (var srcRow of srcDocketEntity.idsData.nonPatentLiterature) {
      if (destDocketEntity.idsData.nonPatentLiterature.every((e) => {
        return e.citation !== srcRow.citation
      })) { //make sure src is not added already
        // console.log(`adding npl ${srcRow.citation} to ${destDocketEntity.attyDocket}`)
        destDocketEntity.idsData.nonPatentLiterature.push({...srcRow, src: srcDocketEntity.attyDocket, cited: false})
      } else {
        // console.log(`skipping npl ${srcRow.citation}, already exists in ${destDocketEntity.attyDocket}`)

      }
    }
  }
  // console.log(destDocketEntity.idsData)
  return destDocketEntity.idsData
}

router.post('/addToDocketSync', checkJwt, upload.none(), async function(req, res, next) {
  //add relatedAttyDocket to list of idssync, add attyDocket to idssync in the relatedAttyDocket case
  var idsMatterData = JSON.parse(req.body.idsMatterData)

  var promiseArray = []

  const idsQuery = datastore
  .createQuery('clientMatter')
  .filter('attyDocket', '=', idsMatterData.attyDocket)
  .filter('firm', '=', idsMatterData.firm)
  promiseArray.push(datastore.runQuery(idsQuery))

  const relatedIdsQuery = datastore
  .createQuery('clientMatter')
  .filter('attyDocket', '=', req.body.relatedAttyDocket)
  .filter('firm', '=', idsMatterData.firm)  
  promiseArray.push(datastore.runQuery(relatedIdsQuery))

  let results = await Promise.all(promiseArray)
  //update current attydocket to add related matter to idssync and related idsData to currentAttydocket
  var currentIdsData = results[0][0][0]
  var relatedIdsData = results[1][0][0]

  if (!currentIdsData.idsSync) {
    currentIdsData.idsSync = []
  }
  if (!currentIdsData.idsSync.includes(req.body.relatedAttyDocket)) {
    currentIdsData.idsSync.push(req.body.relatedAttyDocket)
  }
  try {
    currentIdsData.idsData = addIdsFromSrcToDest(relatedIdsData, currentIdsData)
    // copy all of relatedIdsQuery matters into currentIdsData
    var updatedMatterEntity = {
      key: results[0][0][0][datastore.KEY],
      data: currentIdsData,
      excludeFromIndexes: ['idsData']
    };
    
    await datastore.upsert(updatedMatterEntity)
  
    } catch (e) {
    console.log(e)
  }


  // update related docket to add current matter to idssync and add current matter idsData to related docket
  if (!relatedIdsData.idsSync) {
    relatedIdsData.idsSync = []
  }
  if (!relatedIdsData.idsSync.includes(idsMatterData.attyDocket)) {
    relatedIdsData.idsSync.push(idsMatterData.attyDocket)
  }
  // copy all of relatedIdsQuery matters into currentIdsData
  try {
    relatedIdsData.idsData = addIdsFromSrcToDest(currentIdsData, relatedIdsData)

    updatedMatterEntity = {
      key: results[1][0][0][datastore.KEY],
      data: relatedIdsData,
      excludeFromIndexes: ['idsData']
    };
    
    await datastore.upsert(updatedMatterEntity)
  
  } catch (e) {
    console.log(e)
  }

  var responseObj = {
    attyDocket: results[0][0][0]
  }
  res.json(responseObj)

});
router.post('/removeFromDocketSync', checkJwt, upload.none(), async function(req, res, next) {
  //remove relatedAttyDocket from list of idssync, remove attyDocket from idssync in the relatedAttyDocket case
  var idsMatterData = JSON.parse(req.body.idsMatterData)

  var promiseArray = []

  const idsQuery = datastore
  .createQuery('clientMatter')
  .filter('attyDocket', '=', idsMatterData.attyDocket)
  .filter('firm', '=', idsMatterData.firm)
  promiseArray.push(datastore.runQuery(idsQuery))

  const relatedIdsQuery = datastore
  .createQuery('clientMatter')
  .filter('attyDocket', '=', req.body.relatedAttyDocket)
  .filter('firm', '=', idsMatterData.firm)  
  promiseArray.push(datastore.runQuery(relatedIdsQuery))

  let results = await Promise.all(promiseArray)
  //update current attydocket to add related matter to idssync and related idsData to currentAttydocket
  var currentIdsData = results[0][0][0]
  currentIdsData.idsSync = currentIdsData.idsSync.filter(e => e !== req.body.relatedAttyDocket)

  var updatedMatterEntity = {
    key: results[0][0][0][datastore.KEY],
    data: currentIdsData,
    excludeFromIndexes: ['idsData']
  };
  await datastore.upsert(updatedMatterEntity)

  // update related docket to add current matter to idssync and add current matter idsData to related docket
  var relatedIdsData = results[1][0][0]
  // console.log(relatedIdsData)
  relatedIdsData.idsSync = relatedIdsData.idsSync.filter(e => e !== idsMatterData.attyDocket)

  updatedMatterEntity = {
    key: results[1][0][0][datastore.KEY],
    data: relatedIdsData,
    excludeFromIndexes: ['idsData']
  };
  
  await datastore.upsert(updatedMatterEntity)

  var responseObj = {
    attyDocket: results[0][0][0]
  }
  res.json(responseObj)

});

module.exports = router;
