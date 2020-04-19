//to port to server, COPY from HERE to STOP COPYING HERE.  ENSURE PACKAGE.JSON is mirrored
//RUN this to test: export GOOGLE_APPLICATION_CREDENTIALS="/Users/jonliu/Documents/code/patentbutler/brain/butler-server-c534c8d5f21f.json"
//NOTE: A version of this is in Cloud Functions that is triggered upon any OA Upload.  Mirror this code there (but be careful)

var testUsingTemp = false; //CHANGE THIS TO FALSE WHEN UPLOADING TO CLOUD FXN
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
function getTextAnnotations(objResponses) {
    var textAnnotations = {}
    for (let page of objResponses) {
        textAnnotations[page.context.pageNumber] = page.fullTextAnnotation.text
    }
    return JSON.stringify(textAnnotations) //need to do this to exclude from index correctly
}

const downloadJSONFile = (filename) => {
    return new Promise(function (resolve, reject) {
        storage
        .bucket(bucketName)
        .file(filename)
        .download(function (err, contents) {
        if (err) {
            reject(err)
        } else {
            resolve(contents)
        }
    })        
    })
}
const generateOaObjectFromText = async (files) => {
    const filename = files[0].name.split('ocr/office-actions/')[1].split('+')[0]
    const processedOaKey = datastore.key(['processedOa', filename]);
    const [processedOaEntity] = await datastore.get(processedOaKey);

    //TESTING
    if (testUsingTemp) {
        const [combinedResponse, syntaxResponse] = await combineResponseAndGetSyntax(JSON.parse(processedOaEntity.temp))
        for (const rej of processedOaEntity.rejectionList) {
            for (const rejType in combinedResponse) {
                if (rej.type === rejType) {
                    rej.claimArgumentList = fillClaimArg(rejType, combinedResponse, syntaxResponse)
                }
            }
        }
        // console.log(processedOaEntity.rejectionList)
        processedOaEntity.priorArtList = await getPAList(combinedResponse, syntaxResponse)
        // console.log(processedOaEntity.priorArtList)
        return processedOaEntity
    }
    //TESTING

    //download json into memory
    const downloadedJSONFiles = []
    for (file of files) {
        console.log(`downloading ${file.name} from storage...`)
        let contents = await downloadJSONFile(file.name)
        downloadedJSONFiles.push(contents)
    }

    //parse all the contents into one file
    var parsedOaObjectResponses = []
    for (const jsonContent of downloadedJSONFiles) {
        let tempParsedOaObject = JSON.parse(jsonContent)
        console.log(`Parsed OCR object: ${tempParsedOaObject.responses.length} pages`);
        parsedOaObjectResponses = parsedOaObjectResponses.concat(tempParsedOaObject.responses)
    }

    processedOaEntity.computerProcessingTime = Date.now()
    processedOaEntity.textAnnotations = getTextAnnotations(parsedOaObjectResponses)

    return getOaObjectFromModel(parsedOaObjectResponses[0], JSON.parse(processedOaEntity.textAnnotations)).then(predictedObt => {
        for (var key in predictedObt) processedOaEntity[key] = predictedObt[key]
        
        return processedOaEntity   
    })

}

const getOaObjectFromModel = async (firstPage, textAnnotations) => {
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
  let topLevelMetadata = ['attyDocket', 'applicationNumber', 'filingDate', 'mailingDate']
  for (var i=0; i<batchResponses.length; i++) {
      const response = batchResponses[i]
    for (var j=0; j<response.payload.length; j++) {
        const annotationPayload = response.payload[j]
        const textSegment = annotationPayload.textExtraction.textSegment;

        if (topLevelMetadata.includes(annotationPayload.displayName)) {
            predictedObt[annotationPayload.displayName] = textSegment.content
        } else if (annotationPayload.displayName === 'header') {
            var rejectionObj = {}
            const [type, typeText] = getTypeAndTypeText(textSegment.content)
            rejectionObj.blurb = getBlurb(annotationPayload, batchResponses, i, j, textAnnotations)

            let token = " {NEWLINE-PB} "
            rejectionObj.blurb = rejectionObj.blurb.replace(/-\n/g, '-') //don't put space if there is a dash leading to next line
            rejectionObj.blurb = rejectionObj.blurb.replace(/\n/g, ' ')
            rejectionObj.blurb = rejectionObj.blurb.split(token).join('\n\n')

            rejectionObj.type = type
            rejectionObj.typeText = typeText
            rejectionObj.id = nanoid()
            rejectionObj.claimArgumentList = []
            rejectionList.push(rejectionObj)
        }

        // console.log(`Text Score: ${annotationPayload.textExtraction.score}`);
    }
  }
  if (topLevelMetadata.some((e) => !predictedObt[e])) {
    //AI didn't guess it; do it the old fashioned way
    const oaMetadata = getOaMetadata(firstPage) //send in the first page    
    for (const metadata of topLevelMetadata) {
        if (!predictedObt[metadata] || ((metadata == 'filingDate' || metadata == 'mailingDate') && predictedObt[metadata].length < 10)) {
            console.log(`ai failed for ${metadata}- old fashioned way found ${oaMetadata[metadata]}...`)
            predictedObt[metadata] = oaMetadata[metadata]
        }

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
                var nextWordOffset = rejectionObj.blurb.substring(oldSplitPos + splitLength).search(/ /) //find next space
                if (nextWordOffset <0) {
                    nextWordOffset = 0
                }
                newSplitPos = oldSplitPos + splitLength + nextWordOffset
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

  predictedObt.temp = JSON.stringify(batchResponses2) //FOR TESTING PURPOSES ONLY TO SAVE MODEL CALLS, ERASE IN PROD
  const [combinedResponse, syntaxResponse] = await combineResponseAndGetSyntax(batchResponses2)
  for (const rej of predictedObt.rejectionList) {
    for (const rejType in combinedResponse) {
        if (rej.type === rejType) {
            rej.claimArgumentList = fillClaimArg(rejType, combinedResponse, syntaxResponse)
        }
    }
}
//   predictedObt.priorArtList = []
  // skip for now
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
                console.log(`${entity.displayName}: ${entity.textExtraction.textSegment.content}`)

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
   var forceDummy = false
   for (var i=0; i<rejResponse.entities.length; i++) {
        var entity = rejResponse.entities[i]
        // check if a citation exists before a claim
        if (entity.displayName === 'citation') {
            if (!didFindClaim) {
                forceDummy = true
                console.log('citation occurred before a claim; should create snippetObj with dummy claim header for the citation!')
            }
        }

        //create obj for every claim header, and add to citation lists
        if (entity.displayName === 'claim' || forceDummy) {
            didFindClaim = true
            const snippetObj = {
                "id": nanoid()
            }
            snippetObj.number = (forceDummy) ? 'CLAIMS' : entity.textExtraction.textSegment.content.toUpperCase()
            var [guessedExaminerText, startingSentenceOffset] = guessExamText(response[rejType].entities, i, synResponse, forceDummy, rejResponse.blurb)
            snippetObj.examinerText = guessedExaminerText

            //guess snippet text based off of one set of parentheses in the exam remarks, may have to do this below after splitting based off of newline token
            snippetObj.snippetText = ''
            snippetObj.citationList = guessCitationList(response[rejType].entities, i, synResponse, forceDummy, startingSentenceOffset)

            claimArgumentList.push(snippetObj)
            forceDummy = false

        }
    }

    //split out claimargument into more snippets based on newline token
    for (i = 0; i<claimArgumentList.length; i++) {
        var snippetObj = claimArgumentList[i]
        var splitExamText = snippetObj.examinerText.split('\n\n')
        if (splitExamText.length == 1) { //no newlines in the text, go to next
            continue
        } else {
            //copy needed as reference point
            let origCitationList = JSON.parse(JSON.stringify(snippetObj.citationList))
            let origExaminerText = snippetObj.examinerText

            //make copies of this obj and replace examiner text with each element
            for (var j=0; j<splitExamText.length; j++) {
                var chunkedExamText = splitExamText[j]
                // console.log(chunkedExamText)
                if (j == 0) { //don't splice into array b/c already is there
                    snippetObj.examinerText = chunkedExamText
                    snippetObj.citationList = splitCitationList(chunkedExamText, origCitationList, origExaminerText)
                    // console.log(snippetObj.citationList)
                } else {
                    const snippetObjCopy = {}
                    snippetObjCopy.number = snippetObj.number
                    snippetObjCopy.id = nanoid()
                    snippetObjCopy.snippetText = ''
                    snippetObjCopy.examinerText = chunkedExamText
                    snippetObjCopy.citationList = splitCitationList(chunkedExamText, origCitationList, origExaminerText)
                    // console.log(snippetObjCopy.citationList)
                    //add the copies after the current 
                    claimArgumentList.splice(i+j, 0, snippetObjCopy)
                }
            }

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
const splitCitationList = (chunkedExamText, origCitationList, origExamText) => {
    var chunkedCitationList = []

    var lengthBeforeChunkedExamText = origExamText.indexOf(chunkedExamText)
    var startingCitationIndex = -1
    var endingCitationIndex = -1 

    
    for (var i = 0; i<origCitationList.length; i++) {
        let citationObj = origCitationList[i]
        if (citationObj.startOffsetFromStartingSentence > lengthBeforeChunkedExamText && startingCitationIndex == -1) {
            startingCitationIndex = i
        }
        if (citationObj.startOffsetFromStartingSentence > lengthBeforeChunkedExamText + chunkedExamText.length) {
            endingCitationIndex = i
            break;
        }
        if (i == origCitationList.length - 1) {
            endingCitationIndex = i+1 //make sure to capture the last citation
            break;
        }
    }
    if (startingCitationIndex == -1) {
        return [] // no citations
    }
    // console.log(`startingCitIndex: ${startingCitationIndex} ending: ${endingCitationIndex}`)
    for (i=startingCitationIndex; i<endingCitationIndex ;i++) {
        let citationObj = origCitationList[i]
        chunkedCitationList.push(citationObj)
    }

    return chunkedCitationList
}
const guessExamText = (entityList, currentEntityIndex, syntax, forceDummy = false, blurb) => {
    /*
    if force dummy is false, this entity is a claim and we want to find text from this claim to the next claim
    if forcedummy is true, that means this entity is a citation (not a claim), and we want to start text from the beginning.
    */
    const currentEntity = entityList[currentEntityIndex]

    var startSentenceIndex = 0;
    var endSentenceIndex = 0;
    if (!forceDummy) {
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

    var startingSentenceOffset = 0;
    var endingSentenceEndOffset = 0;
    for (i=startSentenceIndex; i<= endSentenceIndex; i++) {
        const sentence = syntax.sentences[i]
        if (i == startSentenceIndex) {
            startingSentenceOffset = sentence.text.beginOffset
        }
        endingSentenceEndOffset = sentence.text.beginOffset + sentence.text.content.length
    }
    //use the blurb so it saves the newlines
    return [blurb.substring(startingSentenceOffset, endingSentenceEndOffset), startingSentenceOffset]
}

const guessCitationList = (entityList, currentEntityIndex, syntax, forceDummy, startingSentenceOffset) => {
    //current entity is a claim or citation (forceDummy = true), iterate through citations until you hit the next "claim" or the end of the entitylist
    const currentEntity = entityList[currentEntityIndex]
    var citationList = []

    //start at entity after this one unless forcedummy, in which case start at the citation entity
    if (forceDummy) {
        currentEntityIndex--
    }
    for (var i=currentEntityIndex+1; i<entityList.length; i++) {
        const tempEntity = entityList[i]
        if (tempEntity.displayName === 'claim') {
            break;
        }
        if (tempEntity.displayName === 'citation') {
            citationList.push({
                id: nanoid(),
                citation: tempEntity.textExtraction.textSegment.content.replace(/\n/g, ''), //remove all \n from citation
                abbreviation: guessAbbrev(entityList, i, syntax),
                startOffsetFromStartingSentence: tempEntity.textExtraction.textSegment.startOffset - startingSentenceOffset //offset used to split up later based on \n
            })
        }

    }

    return citationList
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
        priorArt.title = priorArt.title.trim()
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
            break;
        }
    }
    const formerAbbrevPathToRoot = getPathToRoot(formerAbbrev, syntax)

    //find abbrev entity in back
    var latterAbbrev = null;
    for (i=currentEntityIndex+1; i<entityList.length; i++) {
        const entity = entityList[i]
        if (entity.displayName === 'abbreviation') {
            latterAbbrev = entity
            break;
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
    for (var i= 0; i<syntax.tokens.length; i++ ) {
        var token = syntax.tokens[i]
        if (token.text.beginOffset === parseInt(entity.textExtraction.textSegment.startOffset)) {
            var tempToken = token
            //use offset after period in case pubnum is US PUB No. 999999 CASE
            if (entity.displayName === 'publicationNumber') {
                //find the token containing the number and get dependencies from that
                for (var j = i; j < syntax.tokens.length; j++) {
                    var nextToken = syntax.tokens[j]
                    if (nextToken.text.content.match(/\d/)) {
                        tempToken = nextToken
                        break;
                    }
                }
            } 

            var didFindRoot = false
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
            if (formerEntityTokenIndex >= 0 && latterEntityTokenIndex >= 0) {
                //the earlier you are, the more likely you're associated
                if (formerEntityTokenIndex <= latterEntityTokenIndex)
                    return formerEntityPathToRoot.content
                else 
                    return latterEntityPathToRoot.content
            }

            if (formerEntityTokenIndex >= 0) {
                return formerEntityPathToRoot.content
            }
            if (latterEntityTokenIndex >= 0) {
                return latterEntityPathToRoot.content
            }
        }
        return formerEntityPathToRoot.content //return former if all goes to shiz
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
    //trim this 
    blurb = blurb.trim()


    //add newlines where it makes sense, replace all other newlines with spaces
    var prevNewlineIndex = 0;
    let token = " {NEWLINE-PB} "
    for (j=0; j<blurb.length; j++) {
        let char = blurb[j]
        if (char == '\n') {
            if (j - prevNewlineIndex < 65) { //taken from average length of line in OA
                blurb = blurb.slice(0, j).trim() + token + blurb.slice(j).trim()
                j = j + token.length
            }

            prevNewlineIndex = j

        }

    }    



    return blurb
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
    //testing
    excludeFromIndexes: ['textAnnotations', 'rejectionList[].blurb', 'rejectionList[].claimArgumentList[].examinerText', 'rejectionList[].claimArgumentList[].snippetText', 'temp'],

    //   excludeFromIndexes: ['textAnnotations', 'rejectionList[].blurb', 'rejectionList[].claimArgumentList[].examinerText', 'rejectionList[].claimArgumentList[].snippetText']
    });


};

const getListOfOCR = async (prefix) => {
    const options = {
        prefix: prefix,
      };
    
      const [files] = await storage.bucket(bucketName).getFiles(options);
      return files    
}
  

// STOP COPYING HERE; ------------------------------------------- //

const main = async () => {
    if (process.argv.length != 3) {
        console.log('-- node parseOa.js FILENAME --')
        return
    }
    let files = await getListOfOCR('ocr/office-actions/' + process.argv[2])
    /*
        gcsEvent is an object of type {name: `ocr/office-actions/${process.argv[2]}+output-1-to-${process.argv[3]}.json`, bucket: bucketName}
    */
    var oaObject = await generateOaObjectFromText(files)
    // return //TESTING
    // console.log(oaObject)
    await saveObjectToDatastore(oaObject)
    const mailData = {
        from: 'ai@patentbutler.com',
        to: 'Jon Liu, jon@patentbutler.com',
        subject: oaObject.filename + ' has been AI\'ed',
        html: 'success!',
        "o:tag" : ['ai']
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
// OCRFile('vypiOtY15QcgWBFusQx8c.pdf') //if you OCR, it creates a file in ocr/office-actions/<filename>+output....json

const temp = async () => {
    const filenames = ['EAT-BCgMgFlYf4v252Fpa', 'TIs4K0RoB', 'WUDPrMHxN', 'hZHzgZ_a1']
    for (var keyname of filenames) {
        const [entity] = await datastore.get(datastore.key(['processedOa', keyname]));
        await datastore.save({
            key: datastore.key(['processedOa', keyname + '.pdf']),
            data: entity,
            excludeFromIndexes: ['textAnnotations', 'rejectionList[].blurb', 'rejectionList[].claimArgumentList[].examinerText', 'rejectionList[].claimArgumentList[].snippetText']
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

const temp2 = () => {
    var json2 = require(`./results/ocr_office-actions_vypiOtY15QcgWBFusQx8c.pdf+output-1-to-20.json`); //with path
    console.log(json2)
}
// temp2()