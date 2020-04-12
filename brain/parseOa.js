//RUN this to test: export GOOGLE_APPLICATION_CREDENTIALS="/Users/jonliu/Documents/code/patentbutler/brain/butler-server-c534c8d5f21f.json"
//NOTE: A version of this is in Cloud Functions that is triggered upon any OA Upload.  Mirror this code there (but be careful)


/*
To train the model:
Upload OAs to the patentbutler-brain bucket -> office actions folder
Add new jsonl or update oaTraining.jsonl to point to the files
Update and upload oaTraining.csv to the Google UI to start labelling
*/

// Imports the Google Cloud client libraries
const vision = require('@google-cloud/vision').v1;
// const {Storage} = require('@google-cloud/storage');
// const storage = new Storage();
// Bucket where the file resides
const bucketName = 'crafty-valve-269403.appspot.com';
const {Datastore} = require('@google-cloud/datastore');
// Instantiate a datastore client
const datastore = new Datastore();
const {Storage} = require('@google-cloud/storage');
const storage = new Storage();

const automl = require('@google-cloud/automl');
const nanoid = require('nanoid').nanoid;

// Create client for prediction service.
const autoMlClient = new automl.PredictionServiceClient();
const mailgun = require("mailgun-js");
const DOMAIN = 'mail.patentbutler.com';
const api_key = '395890d26aad6ccac5435c933c0933a3-9a235412-6950caab'
const mg = mailgun({apiKey: api_key, domain: DOMAIN});

const language = require('@google-cloud/language');
// Creates a client
const langClient = new language.LanguageServiceClient();
const cheerio = require('cheerio')
const fetch = require('node-fetch');


function getOaMetadata(pageObj) {
    if (pageObj.fullTextAnnotation.pages.length > 1) {
        console.log('pages length should not be longer than 1 -> investigate')
        return null
    }
    //need applicationNumber, attyDocket, filingDate, mailingDate
    var metadataObj = {}
    var indexBB = {}
    let heightLimit = 0.37
    for (let block of pageObj.fullTextAnnotation.pages[0].blocks) {
        if (block.blockType === "TEXT") {
            for (let paragraph of block.paragraphs) {
                if (paragraph.boundingBox.normalizedVertices[0].y > heightLimit) //only process on blocks near top of page
                    continue
                var phrase = ''
                for (let word of paragraph.words) {
                    for (let symbol of word.symbols) {
                        phrase = phrase + symbol.text
                    }
                    phrase = phrase + ' '
                }
                if (phrase.toLowerCase().includes("application no")) {
                    indexBB.applicationNumber = paragraph.boundingBox.normalizedVertices
                } else if (phrase.toLowerCase().includes("filing date")) {
                    indexBB.filingDate = paragraph.boundingBox.normalizedVertices
                } else if (phrase.toLowerCase().includes("attorney docket")) {
                    indexBB.attyDocket = paragraph.boundingBox.normalizedVertices
                } else if (phrase.toLowerCase().includes("notification date") || phrase.toLowerCase().includes("mail date")) {
                    indexBB.mailingDate = paragraph.boundingBox.normalizedVertices
                }
                // console.log(phrase)
                // console.log(paragraph.boundingBox.normalizedVertices)
            }
        } else {
            console.log('--- diff block type ->  ---')
            console.log(block)
        }
    }

    // console.log(indexBB)
    // console.log('---------------')
    //for each key, find the closest paragraph
    for (let key in indexBB) {
        paragraph = findRelevantParagraph(indexBB[key], pageObj.fullTextAnnotation.pages[0].blocks)
        if (paragraph) {
            var phrase = ''
            for (let word of paragraph.words) {
                for (let symbol of word.symbols) {
                    phrase = phrase + symbol.text
                }
                phrase = phrase + ' '
            }
            //remove excess spaces
            phrase = phrase.replace(/\s+/g, '');
            metadataObj[key] = phrase
        } else {
            console.log('could not find para')
        }
    }
    

    return metadataObj
}

//find the closest paragraph; has to be below the metadatafield bounding box
function findRelevantParagraph(metadataFieldVertexArray, blocks) {
    var shortestDistance = 1;
    var shortestParagraph = null;

    //assumes top left is 0, top right is 1, bottom right is 2, bottom left is 3
    const relevantMidpoint = {}
    relevantMidpoint.x = (metadataFieldVertexArray[0].x + metadataFieldVertexArray[1].x) / 2
    relevantMidpoint.y = (metadataFieldVertexArray[0].y + metadataFieldVertexArray[3].y) / 2

    for (let block of blocks) {
        for (let paragraph of block.paragraphs) {
            let vertices = paragraph.boundingBox.normalizedVertices
            const paraMidpoint = {}
            paraMidpoint.x = (vertices[0].x + vertices[1].x) / 2
            paraMidpoint.y = (vertices[0].y + vertices[3].y) / 2      
            if (paraMidpoint.y < relevantMidpoint.y) continue
            let distance = Math.hypot(relevantMidpoint.x-paraMidpoint.x, relevantMidpoint.y-paraMidpoint.y)
            if (distance < shortestDistance && distance !== 0) {
                shortestDistance = distance;
                shortestParagraph = paragraph
            }
    
        }
    }

    return shortestParagraph
}
function getTextAnnotations(obj) {
    var textAnnotations = {}
    for (let page of obj.responses) {
        textAnnotations[page.context.pageNumber] = page.fullTextAnnotation.text
    }
    return JSON.stringify(textAnnotations) //need to do this to exclude from index correctly
}
function getRejectionList(obj) {
    var rejectionList = []
    for (let page of obj) {
        if (!page.fullTextAnnotation.text.toLowerCase().includes("claim rejection"))
            continue
        for (let block of page.fullTextAnnotation.pages[0].blocks) {
            if (block.blockType === "TEXT") {
                for (let paragraph of block.paragraphs) {
                    var phrase = ''
                    for (let word of paragraph.words) {
                        for (let symbol of word.symbols) {
                            phrase = phrase + symbol.text
                        }
                        phrase = phrase + ' '
                    }
                    if (phrase.toLowerCase().includes("application no")) {
                        indexBB.applicationNumber = paragraph.boundingBox.normalizedVertices
                    } else if (phrase.toLowerCase().includes("filing date")) {
                        indexBB.filingDate = paragraph.boundingBox.normalizedVertices
                    } else if (phrase.toLowerCase().includes("attorney docket")) {
                        indexBB.attyDocket = paragraph.boundingBox.normalizedVertices
                    } else if (phrase.toLowerCase().includes("notification date") || phrase.toLowerCase().includes("mail date")) {
                        indexBB.mailingDate = paragraph.boundingBox.normalizedVertices
                    }
                    // console.log(phrase)
                    // console.log(paragraph.boundingBox.normalizedVertices)
                }
            } else {
                console.log('--- diff block type in rejectionlist->  ---')
                console.log(block)
            }
        }
    }

    return rejectionList
}
const generateOaObjectFromText = async (gcsEvent) => {
    const filename = gcsEvent.name.split('ocr/office-actions/')[1].split('+')[0]
    const processedOaKey = datastore.key(['processedOa', filename]);
    const [processedOaEntity] = await datastore.get(processedOaKey);

    const [combinedResponse, syntaxResponse] = await combineResponseAndGetSyntax(processedOaEntity.temp)
    for (const rej of processedOaEntity.rejectionList) {
        for (const rejType in combinedResponse) {
            if (rej.type === rejType) {
                rej.claimArgumentList = fillClaimArg(rejType, combinedResponse, syntaxResponse)
            }
        }
    }
    console.log(processedOaEntity.rejectionList)
    // processedOaEntity.priorArtList = await getPAList(combinedResponse, syntaxResponse)
    // console.log(processedOaEntity.priorArtList)
    //TESTING
    return processedOaEntity

    //download json into memory
    console.log("creating oaObject from ocr'ed pdf...")
    return new Promise(function (resolve, reject) {
        storage
        .bucket(gcsEvent.bucket)
        .file(gcsEvent.name)
        .download(function (err, contents) {
        if (err) {
            reject(err)
        } else {
            var parsedOaObject = JSON.parse(contents)
            console.log(`Parsed OCR object: ${parsedOaObject.responses.length} pages`);
            //comment out the bottom 2 lines b/c the model might be more accurate
            // var metadataObj = getOaMetadata(parsedOaObject.responses[0]) //send in the first page of the OA
            // for (var key in metadataObj) processedOaEntity[key] = metadataObj[key]
            processedOaEntity.computerProcessingTime = Date.now()
            processedOaEntity.textAnnotations = getTextAnnotations(parsedOaObject)

            getOaObjectFromModel(filename, JSON.parse(processedOaEntity.textAnnotations)).then(predictedObt => {
                for (var key in predictedObt) processedOaEntity[key] = predictedObt[key]
                
                resolve(processedOaEntity)    
            })
        }
    })        
    })
}

const getOaObjectFromModel = async (filename, textAnnotations) => {
  const projectId = `crafty-valve-269403`;
  const computeRegion = `us-central1`;
  const modelId = `TEN8646238383435153408`;
//   const scoreThreshold = 0.5

  // Get the full path of the model.
  const modelFullId = autoMlClient.modelPath(projectId, computeRegion, modelId);
  const params = {};

  
  //cannot use PDFs b/c google only processes 5 pages of the pdf

  // Read the file content for prediction.
//   const file_path = `gs://crafty-valve-269403.appspot.com/uploaded-office-actions/${filename}`

//   // Set the payload by giving the content and type of the file.
//   const payload = {'document': {'inputConfig': {'gcsSource': {'inputUris': [file_path] } } } };
    

  //need to loop textsnippets....
  //use first classifier to fill in metadata
  var batchResponses = []

  //make request on a per-page basis.  Google limit is 10k characters.  Most per page seems to be 4k.  
  for (const page in textAnnotations) {
    const payload = {'textSnippet': {'content': textAnnotations[page], mimeType: 'text/plain'}}
    console.log("predicting metadata: page " + page)
    const [response] = await autoMlClient.predict({
        name: modelFullId,
        payload: payload,
        params: params,
    })
    batchResponses.push(response)
  }
  var predictedObt = {}
  var rejectionList = []
  for (var i=0; i<batchResponses.length; i++) {
      const response = batchResponses[i]
    for (var j=0; j<response.payload.length; j++) {
        const annotationPayload = response.payload[j]
        const textSegment = annotationPayload.textExtraction.textSegment;

        if (annotationPayload.displayName === 'attyDocket' || annotationPayload.displayName === 'applicationNumber' || annotationPayload.displayName === 'filingDate' || annotationPayload.displayName === 'mailingDate') {
            predictedObt[annotationPayload.displayName] = textSegment.content
        } else if (annotationPayload.displayName === 'header') {
            //skip creating Conclusion as a header
            var rejectionObj = {}
            const [type, typeText] = getTypeAndTypeText(textSegment.content)
            rejectionObj.blurb = getBlurb(annotationPayload, batchResponses, i, j, textAnnotations)
            rejectionObj.type = type
            rejectionObj.typeText = typeText
            rejectionObj.id = nanoid()
            rejectionObj.claimArgumentList = []
            rejectionList.push(rejectionObj)
        }

        // console.log(`Text Score: ${annotationPayload.textExtraction.score}`);
    }
  }
  predictedObt.rejectionList = rejectionList

  //use second classifier to fill claimArgumentList and priorArtList
  //need to loop rejection....
  var batchResponses2 = {'102': [], '103': []}
  const modelId2 = `TEN7427240628045479936`;
//   const scoreThreshold = 0.5

  // Get the full path of the model.
  const modelFullId2 = autoMlClient.modelPath(projectId, computeRegion, modelId2);
  const params2 = {};
  const splitLength = 9000 //Google limits to 10k characters
  for (const rejectionObj of rejectionList) {
      if (rejectionObj.type === '102' || rejectionObj.type === '103') {
          console.log(`blurb length: ${rejectionObj.blurb.length}`)
          var numRequests = parseInt(rejectionObj.blurb.length / splitLength ) + 1;
          var oldSplitPos = 0;
          var newSplitPos = 0;
          var tempBlurb = ''
          for (i = 0; i<numRequests; i++) {
              if (i == numRequests - 1) { //last request
                tempBlurb = rejectionObj.blurb.substring(oldSplitPos)
              } else {
                newSplitPos = oldSplitPos + splitLength + rejectionObj.blurb.substring(oldSplitPos + splitLength).search(/\n/) //find next newline
                tempBlurb = rejectionObj.blurb.substring(oldSplitPos, newSplitPos)    
              }

              const payload2 = {'textSnippet': {'content': tempBlurb, mimeType: 'text/plain'}}
              console.log(`predicting ${rejectionObj.type}: oldsplitpos ${oldSplitPos} newsplitpos ${newSplitPos}`)
              const [response] = await autoMlClient.predict({
                  name: modelFullId2,
                  payload: payload2,
                  params: params2,
              })
              batchResponses2[rejectionObj.type].push({'response': response,
                'blurb': tempBlurb})    
                    

              oldSplitPos = newSplitPos
          }
      }
  }

  predictedObt.temp = batchResponses2 //FOR TESTING PURPOSES ONLY TO SAVE MODEL CALLS, ERASE IN PROD
  const [combinedResponse, syntaxResponse] = await combineResponseAndGetSyntax(batchResponses2)
  for (const rej of predictedObt.rejectionList) {
    for (const rejType in combinedResponse) {
        if (rej.type === rejType) {
            rej.claimArgumentList = fillClaimArg(rejType, combinedResponse, syntaxResponse)
        }
    }
}
  predictedObt.priorArtList = await getPAList(combinedResponse, syntaxResponse)
  return predictedObt

}
const combineResponseAndGetSyntax = async (batchResponses) => {
    var combinedResponse = {}
    for (const rejType in batchResponses) {
        combinedResponse[rejType] = {'blurb': '', entities: []}
        var lengthOfPreviousBlurbs = 0
        for (const miniResponse of batchResponses[rejType]) {
            const miniListOfEntities = miniResponse.response.payload
            for (const entity of miniListOfEntities) {
                //change the offsets
                entity.textExtraction.textSegment.startOffset = String(parseInt(entity.textExtraction.textSegment.startOffset) + lengthOfPreviousBlurbs)
                entity.textExtraction.textSegment.endOffset = String(parseInt(entity.textExtraction.textSegment.endOffset) + lengthOfPreviousBlurbs)
            }
            lengthOfPreviousBlurbs = lengthOfPreviousBlurbs + miniResponse.blurb.length
            combinedResponse[rejType].blurb = combinedResponse[rejType].blurb + miniResponse.blurb
            combinedResponse[rejType].entities = combinedResponse[rejType].entities.concat(miniListOfEntities)
        }
    }

    var syntaxResponse = {}
    for (const rejType in combinedResponse) {
        const document = {
            content: combinedResponse[rejType].blurb,
            type: 'PLAIN_TEXT',
          };
        
          // Need to specify an encodingType to receive word offsets; use utf16 b/c JS engine is utf16 by default
          const encodingType = 'UTF16';
          // Detects the sentiment of the document
          const [syntax] = await langClient.analyzeSyntax({document, encodingType});
          syntaxResponse[rejType] = syntax
    }


    return [combinedResponse, syntaxResponse]
}

const fillClaimArg = (rejType, response, syntaxResponse) => {
    /*
    find citations
    find associated claim (look above)
    ~optional~ fill in blurb?
    */
   const rejResponse = response[rejType]
   const synResponse = syntaxResponse[rejType]
   var claimArgumentList = []
   var didFindClaim = false
   for (var i=0; i<rejResponse.entities.length; i++) {
        var entity = rejResponse.entities[i]
        // check if a citation exists before a claim
        if (entity.displayName === 'citation') {
            if (!didFindClaim) {
                console.log('citation occurred before a claim; should create snippetObj with dummy claim header for the citation!')
            }
        }

        //create obj for every claim header, and add to citation lists
        if (entity.displayName === 'claim') {
            didFindClaim = true
            const snippetObj = {
                "id": nanoid()
            }
            snippetObj.number = entity.textExtraction.textSegment.content.toUpperCase()
            var [guessedExaminerText, guessedSnippetText] = guessExamSnipText(response[rejType].entities, i, synResponse)
            snippetObj.examinerText = guessedExaminerText
            snippetObj.snippetText = guessedSnippetText
            snippetObj.citationList = guessCitationList(response[rejType].entities, i, synResponse)

            claimArgumentList.push(snippetObj)
        }
    }
    
    if (claimArgumentList.length == 0) {
        claimArgumentList.push({
            number: '', 
            snippetText: '', 
            examinerText: '',
            citationList: [],
            id: nanoid()
        })     
    }
    return claimArgumentList
}

const guessExamSnipText = (entityList, currentEntityIndex, syntax) => {
    /*
    find text from this claim to the next claim
    */
    const currentEntity = entityList[currentEntityIndex]
    // if (currentEntity.textExtraction.textSegment.content.toUpperCase() === "CLAIM 21") {
    //     console.log(currentEntity)
    // }
    var startSentenceIndex = 0;
    var endSentenceIndex = 0;
    for (var i=0; i<syntax.sentences.length; i++) {
        const sentence = syntax.sentences[i]
        if (sentence.text.beginOffset + sentence.text.content.length > currentEntity.textExtraction.textSegment.startOffset) { //sentence including the currentEntity
            startSentenceIndex = i
            break;
        }
    }
    if (startSentenceIndex < 0) {
        startSentenceIndex = 0
        console.log('how did this happen??')
    }

    var didHitClaim = false
    for (i=currentEntityIndex+1; i< entityList.length ;i++) {
        const tempEntity = entityList[i]
        if (tempEntity.displayName === 'claim') {
            didHitClaim = true
            for (var j=startSentenceIndex; j<syntax.sentences.length; j++) {
                const sentence = syntax.sentences[j]
                if (sentence.text.beginOffset + sentence.text.content.length > tempEntity.textExtraction.textSegment.startOffset) { //sentence with the tempEntity
                    endSentenceIndex = j-1
                    const endSentence = syntax.sentences[endSentenceIndex]
                    if (endSentence.text.content.match(/^\d+\.$/g)) {
                        //short sentence: 2., 3.
                        endSentenceIndex-- //ignore it.
                    }
                    break;
                }
            }
            //add text up to the sentence before this entity
            break;
        }
    }
    if (endSentenceIndex < startSentenceIndex) {
        endSentenceIndex = startSentenceIndex
    }
    if (!didHitClaim) { //no more claim after this, include the rest of the blurb
        endSentenceIndex = syntax.sentences.length - 1
    }

    var examText = ''
    for (i=startSentenceIndex; i<= endSentenceIndex; i++) {
        const sentence = syntax.sentences[i]
        examText += sentence.text.content + ' '
    }

    //guess snippet text based off of one set of parentheses in the exam remarks)
    var snipText = ''

    return [examText.replace(/\n/g, ' '), snipText]
}

const guessCitationList = (entityList, currentEntityIndex, syntax) => {
    const currentEntity = entityList[currentEntityIndex]
    return []
}

const getPAList = async (response, syntaxResponse) => {
    var priorArtList = []
    /*
    Go through all publication number entities
    Associate nearest abbrev in same sentence with entity
    Download OA automatically and fill in metadata from number if possible
    */

    for (const rejType in response) {
        for (var i=0; i<response[rejType].entities.length; i++) {
            var entity = response[rejType].entities[i]
            if (entity.displayName === 'publicationNumber') {

                const paObj = {
                    "title": '',
                    "publicationNumber": '',
                    "abbreviation": '',
                    "originalname": '',
                    "filename": '',
                    "cloudUrl": '',
                    "citationList": [],
                    "assignee": '',
                    "id": nanoid()
                }
                paObj.publicationNumber = guessPubNum(entity.textExtraction.textSegment.content)
                //don't add to array if palist already has object with this pubnum
                var addToArray = true;
                for (const pa of priorArtList) {
                    if (pa.publicationNumber === paObj.publicationNumber) {
                        addToArray = false
                        console.log(`${pa.publicationNumber} already in paList, not adding`)
                    }
                }
                paObj.abbreviation = guessAbbrev(response[rejType].entities, i, syntaxResponse[rejType])
                if (addToArray) {
                    priorArtList.push(paObj)
                }
            }
        }
    }

    await getPaMetadata(priorArtList)
    
    return priorArtList
}
const getPaMetadata = async (priorArtList) => {
    for (const priorArt of priorArtList) {
        let url = `https://patents.google.com/patent/${priorArt.publicationNumber}`
        let res = await fetch(url)
        let body = await res.text()
        const $ = cheerio.load(body)
        /*
<meta name="DC.title" content="Flow Cells for Electron Microscope Imaging With Multiple Flow Streams 
   ">
<meta name="DC.date" content="2012-05-23" scheme="dateSubmitted">
<meta name="DC.description" content="
 Provided are flow cell devices&#x2014;referred to as nanoaquariums&#x2014;that are microfabricated devices featuring a sample chamber having a controllable height in the range of nanometers to micrometers. The cells are sealed so as to withstand the vacuum environment of an electron microscope without fluid loss. The cells allow for the concurrent flow of multiple sample streams and may be equipped with electrodes, heaters, and thermistors for measurement and other analysis devices. 
">
<meta name="citation_patent_application_number" content="US:13/478,413">
<meta name="citation_pdf_url" content="https://patentimages.storage.googleapis.com/c8/c7/81/9ca511d8da83a7/US20120298883A1.pdf">
<meta name="citation_patent_publication_number" content="US:20120298883:A1">
<meta name="DC.date" content="2012-11-29">
<meta name="DC.contributor" content="Joseph M. Grogan" scheme="inventor">
<meta name="DC.contributor" content="Haim H. Bau" scheme="inventor">    
<meta name="DC.contributor" content="University of Pennsylvania" scheme="assignee">

        */
        priorArt.title = $('meta[name="DC.title"]').attr("content") || ''
        priorArt.assignee = $('meta[scheme="assignee"]').attr("content") || ''
        let parsedCloudUrl = $('meta[name="citation_pdf_url"]').attr("content") || ''
        if (parsedCloudUrl.includes(".pdf")) {
            console.log('retrieving, from goog, ' + parsedCloudUrl)
            let buffer = await fetch(parsedCloudUrl).then(res => res.buffer())
            let splitUrlArray = parsedCloudUrl.split('/')
            priorArt.originalname = splitUrlArray[splitUrlArray.length - 1] //last element to be the name
            console.log('downloading ' + priorArt.originalname)
            var [cloudUrl, filename] = await uploadBuffer(priorArt.originalname, buffer)
            priorArt.cloudUrl = cloudUrl
            priorArt.filename = filename    
        }
    }

    return priorArtList
}
const uploadBuffer = (originalname, buffer) => {
    const directory = 'uploaded-cited-art/'
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
        blob.makePublic(function (err, apiResponse) {
            const cloudUrl = 'https://storage.googleapis.com/' + bucketName + '/' + blob.name;
            resolve([cloudUrl, filename])
        });
      });
    
      blobStream.end(buffer);
    
    })
  }
  
const guessPubNum = (content) => {
    var pubNum = content.replace(/\/|,|-| |\.|\n/g, '') //remove slashes, commas, dashes, spaces, periods, newlines
    //2 digits or more to avoid kind codes
    var pubRegexp = new RegExp(/([a-zA-Z]*)(\d\d+)/, 'g');
    
    var matches = pubRegexp.exec(pubNum) 
    if (matches == null) {
        return ''
    } else {
        if (matches[1].length === 0 || matches[1].toLowerCase().includes("us")) {
            pubNum = "US"+matches[2]
        } else {
            pubNum = matches[1]+matches[2]
        }
    }
    return pubNum
}
const guessAbbrev = (entityList, currentEntityIndex, syntax) => {
    // find token with entity offset, then map it to the most likely publication number based off dependency tree
    // specifically, find abbrev entity on both sides, get path to ROOT.  Abbrev entity with shortest path to overlapping headTokenIndex is associated with this entity.  
    const currentEntity = entityList[currentEntityIndex]
    const currentEntityPathToRoot = getPathToRoot(currentEntity, syntax)

    //find abbrev entity in front
    var formerAbbrev = null
    for (var i=currentEntityIndex-1; i >= 0; i--) {
        const entity = entityList[i]
        if (entity.displayName === 'abbreviation') {
            formerAbbrev = entity
        }
    }
    const formerAbbrevPathToRoot = getPathToRoot(formerAbbrev, syntax)

    //find abbrev entity in back
    var latterAbbrev = null;
    for (i=currentEntityIndex+1; i<entityList.length; i++) {
        const entity = entityList[i]
        if (entity.displayName === 'abbreviation') {
            latterAbbrev = entity
        }
    }
    const latterAbbrevPathToRoot = getPathToRoot(latterAbbrev, syntax)

    const abbrev = shortestOverlappingPath(currentEntityPathToRoot, formerAbbrevPathToRoot, latterAbbrevPathToRoot)

    return abbrev
}
const getPathToRoot = (entity, syntax) => {
    if (entity == null) {
        return null
    }
    var headTokensToRoot = []
    for (token of syntax.tokens) {
        if (token.text.beginOffset === parseInt(entity.textExtraction.textSegment.startOffset)) {
            var didFindRoot = false
            var tempToken = token
            while (!didFindRoot) {
                const headToken = syntax.tokens[tempToken.dependencyEdge.headTokenIndex]
                if (headToken.dependencyEdge.label === 'ROOT' || headTokensToRoot.length > 100) { //prevent infinite loops
                    didFindRoot = true
                }
                headTokensToRoot.push(tempToken.dependencyEdge.headTokenIndex)
                tempToken = syntax.tokens[tempToken.dependencyEdge.headTokenIndex]
            }
            break;
        }
    }
    return {
        content: entity.textExtraction.textSegment.content,
        pathArray: headTokensToRoot
    }
}

const shortestOverlappingPath = (currentEntityPathToRoot, formerEntityPathToRoot, latterEntityPathToRoot) => {
    if (formerEntityPathToRoot == null && latterEntityPathToRoot == null) {
        return ''
    } else if (formerEntityPathToRoot == null) {
        return latterEntityPathToRoot.content
    } else if (latterEntityPathToRoot == null) {
        return formerEntityPathToRoot.content
    } else {
        for (var i=0; i<currentEntityPathToRoot.pathArray.length; i++) {
            var headTokenIndex = currentEntityPathToRoot.pathArray[i]
            var formerEntityTokenIndex = formerEntityPathToRoot.pathArray.indexOf(headTokenIndex)
            var latterEntityTokenIndex = latterEntityPathToRoot.pathArray.indexOf(headTokenIndex)
            if (formerEntityTokenIndex >= 0) {
                return formerEntityPathToRoot.content
            }
            if (latterEntityTokenIndex >= 0) {
                return latterEntityPathToRoot.content
            }
        }
        return ''
    }
}
//textANnotations is NOT zero-indexed
const getBlurb = (annotationPayload, batchResponses, currentIndex, currentHeaderIndex, textAnnotations) => {
    var blurb = ''
    var blurbTracker = {
        startPage: currentIndex,
        startBlurbOffset: annotationPayload.textExtraction.textSegment.endOffset
    }
    var didGoToNextPage = false
    //find the next header so the blurb can go up to it
    for (var i=currentIndex; i<batchResponses.length; i++) {
        const response = batchResponses[i]

        if (response.payload.length == 0 && i != batchResponses.length-1) { //no headers on this page, but it's not the last page
            currentHeaderIndex = 0; //reset header index since we're going to the next page
            didGoToNextPage = true
            continue
        } else if (currentHeaderIndex + 1 >= response.payload.length && i + 1 >= batchResponses.length) { //this header is the last of the current page and no more next page
            blurbTracker.endPage = i
            blurbTracker.endBlurbOffset = textAnnotations[i+1].length
            break;
        } else if (currentHeaderIndex + 1 >= response.payload.length && blurbTracker.startPage == i) { //this header is the last of the current page
            currentHeaderIndex = 0; //reset header index since we're going to the next page
            didGoToNextPage = true
            continue; //go to the next page
        } else { //the next header is in the current page
            blurbTracker.endPage = i
            if (didGoToNextPage) currentHeaderIndex--
            blurbTracker.endBlurbOffset = response.payload[currentHeaderIndex+1].textExtraction.textSegment.startOffset
            break;
        }
    }

    //fill in the blurb
    for (var i= blurbTracker.startPage; i<=blurbTracker.endPage; i++) {
        if (i == blurbTracker.startPage && i == blurbTracker.endPage ) {
            blurb += stripText(textAnnotations[i+1].substring(blurbTracker.startBlurbOffset, blurbTracker.endBlurbOffset))
            break;
        } else if (i == blurbTracker.startPage) { //get blurb to end of the page
            blurb += stripText(textAnnotations[i+1].substring(blurbTracker.startBlurbOffset))
        } else if (i == blurbTracker.endPage) { //end page (new page, so need to strip text from top)
            const strippedText = stripText(textAnnotations[i+1].substring(0, blurbTracker.endBlurbOffset))
            blurb += strippedText
            break;
        } else { //a page with no header -> add the whole page
            const strippedText = stripText(textAnnotations[i+1])
            blurb += strippedText
        }
    }
    return blurb.trim()
}
const stripText = (text) => {
    var rows = text.trim().split('\n')
    var stripped = ''
    for (row of rows) {
        if ((row.toLowerCase().includes("page") && row.length < 10) ||
        (row.toLowerCase().includes("application/control number")) ||
        (row.toLowerCase().includes("art unit") && row.length < 18)) {
            //don't add row of 3 things at the top if they exist: app number, art unit, page num
            continue 
        } else {
            if (row.match(/^\d+\.$/g) ) {
                //remove lines that are short and match any numbered line with . & \n, e.g., 1.,\n... 2.\n, ....
                stripped += row + " "
            } else {
                stripped += row + "\n"
            }
        }
    }

    return stripped
}

const getTypeAndTypeText = (content) => {
    if (content.includes("101")) {
        return ["101", "§ 101 Rejection"]
    } else if (content.includes("102")) {
        return ["102", "§ 102 Rejection"]
    } else if (content.includes("112")) {
        return ["112", "§ 112 Rejection"]
    } else if (content.includes("103")) {
        return ["103", "§ 103 Rejection"]
    } else {
        return ["otherRej", content]
    }
}

const saveObjectToDatastore = processedOaObject => {
    return datastore.save({
      key: datastore.key(['processedOa', processedOaObject.filename]),
      data: processedOaObject,
      excludeFromIndexes: ['textAnnotations', 'rejectionList[].blurb', 'rejectionList[].claimArgumentList','temp.102[].blurb', 'temp.103[].blurb']
    });
};
  

// STOP COPYING HERE; ------------------------------------------- //

const main = async () => {
    // OCRFile('WUDPrMHxN') //if you OCR, it creates a file in ocr/office-actions/<filename>+output....json
    const tempName = 'ocr/office-actions/yHFK3WlcN5k0f_CdWcgqC.pdf+output-1-to-8.json'

    var oaObject = await generateOaObjectFromText({name: tempName, bucket: bucketName})
    // return //TESTING
    // console.log(oaObject)
    await saveObjectToDatastore(oaObject)
    const mailData = {
        from: 'ai@patentbutler.com',
        to: 'Jon Liu, jon@patentbutler.com',
        subject: oaObject.filename + ' has been AI\'ed',
        text: 'success!'
      };
      mg.messages().send(mailData);  
    
}



async function OCRFile(filename) {
    // Creates a client
    const client = new vision.ImageAnnotatorClient();
    // Path to PDF file within bucket
    const pathWithFile = `uploaded-office-actions/${filename}`;
    // The folder to store the results
    const outputPrefix = 'ocr/office-actions'

    const gcsSourceUri = `gs://${bucketName}/${pathWithFile}`;
    const gcsDestinationUri = `gs://${bucketName}/${outputPrefix}/${filename}+`;

    const inputConfig = {
    // Supported mime_types are: 'application/pdf' and 'image/tiff'
    mimeType: 'application/pdf',
    gcsSource: {
        uri: gcsSourceUri,
    },
    };
    const outputConfig = {
    gcsDestination: {
        uri: gcsDestinationUri,
    },
    };
    const features = [{type: 'DOCUMENT_TEXT_DETECTION'}];
    const request = {
    requests: [
        {
        inputConfig: inputConfig,
        features: features,
        outputConfig: outputConfig,
        },
    ],
    };
    const [operation] = await client.asyncBatchAnnotateFiles(request);
    const [filesResponse] = await operation.promise();
    const destinationUri =
        filesResponse.responses[0].outputConfig.gcsDestination.uri;
    console.log('Json saved to: ' + destinationUri);
}

main()

const temp = async () => {
    const filenames = ['EAT-BCgMgFlYf4v252Fpa', 'TIs4K0RoB', 'WUDPrMHxN', 'hZHzgZ_a1']
    for (var keyname of filenames) {
        const [entity] = await datastore.get(datastore.key(['processedOa', keyname]));
        await datastore.save({
            key: datastore.key(['processedOa', keyname + '.pdf']),
            data: entity,
            excludeFromIndexes: ['textAnnotations', 'rejectionList[].blurb', 'rejectionList[].claimArgumentList']
          });
          const [entity2] = await datastore.get(datastore.key(['oaUpload', keyname]));
          await datastore.save({
              key: datastore.key(['oaUpload', keyname + '.pdf']),
              data: entity2,
            });
  
        console.log(`${keyname} copied`)
        
    }
}
// temp()