//RUN this: export GOOGLE_APPLICATION_CREDENTIALS="/Users/jonliu/Documents/code/patentbutler/brain/butler-server-c534c8d5f21f.json"

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

//find the closest paragraph
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
            let distance = Math.hypot(relevantMidpoint.x-paraMidpoint.x, relevantMidpoint.y-paraMidpoint.y)
            if (distance < shortestDistance && distance !== 0) {
                shortestDistance = distance;
                shortestParagraph = paragraph
            }
    
        }
    }

    return shortestParagraph
}
function getTextAnnotation(obj) {


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
const generateOaObjectFromText = (gcsEvent) => {
    //download json into memory
    console.log("saving oaObject to datastore from ocr'ed pdf...")
    return new Promise(function (resolve, reject) {
        storage
        .bucket(gcsEvent.bucket)
        .file(gcsEvent.name)
        .download(function (err, contents) {
        if (err) {
            reject(err)
        } else {
            var parsedOaObject = JSON.parse(contents)
            var oaObject = getOaMetadata(parsedOaObject.responses[0]) //send in the first page of the OA
            // oaObject.textAnnotation = getTextAnnotation(parsedOaObject)
            // oaObject.rejectionList = getRejectionList(parsedOaObject.responses)
            resolve(oaObject)
        }
    })        
    })
}
const saveObjectToDatastore = processedOaObject => {
    return datastore.save({
      key: datastore.key(['processedOa', processedOaObject.filename]),
      data: processedOaObject,
    });
};
  
const main = async () => {
    const tempName = 'ocr/office-actions/hZHzgZ_a1+output-1-to-8.json'
    var oaObject = await generateOaObjectFromText({name: tempName, bucket: bucketName})
    oaObject.computerProcessingTime = Date.now()
    oaObject.filename = tempName.split('ocr/office-actions/')[1].split('+')[0]

    const processedOaKey = datastore.key(['processedOa', oaObject.filename]);
    const [processedOaEntity] = await datastore.get(processedOaKey);
    for(var k in processedOaEntity) oaObject[k]=processedOaEntity[k];
    console.log(oaObject)
    await saveObjectToDatastore(oaObject)
}
// OCRFile('hZHzgZ_a1')

main()