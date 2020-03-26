//RUN this: export GOOGLE_APPLICATION_CREDENTIALS="/Users/jonliu/Documents/code/patentbutler/brain/butler-server-c534c8d5f21f.json"

// Imports the Google Cloud client libraries
const vision = require('@google-cloud/vision').v1;
// const {Storage} = require('@google-cloud/storage');
// const storage = new Storage();
// Bucket where the file resides
const bucketName = 'crafty-valve-269403.appspot.com';

// Creates a client
const client = new vision.ImageAnnotatorClient();

async function OCRFile(filename) {
    // Path to PDF file within bucket
    const pathWithFile = `uploaded-office-actions/${filename}`;
    // The folder to store the results
    const outputPrefix = 'temp'

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
// OCRFile('WUDPrMHxN')

function phraseInParagraph(paragraph, phrase) {

}

var parsedOaObject = require('./results/temp_WUDPrMHxN+output-1-to-8.json')
for (let page of parsedOaObject.responses) {
    if (page.fullTextAnnotation.pages.length > 1) {
        console.log('weirdness -> investigate')
    }
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
                console.log(phrase)
                console.log(paragraph.boundingBox.normalizedVertices)
            }
        } else {
            console.log('--- diff block type ---')
            console.log(block)
        }
    }
    break; //only go over 1 page
}
