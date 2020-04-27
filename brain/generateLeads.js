/*
Go to https://ped.uspto.gov/peds/#/search
refine it by 
Status = 'Non Final Action Mailed'
Status Date = 2020
Filing Date = 2007+ (PAIR only available after 2006)

Go to Public Pair for application
Download OA
Set up Demo
Find who signed the previous response
Email that person for a demo

*/

const {Datastore} = require('@google-cloud/datastore');
// Instantiate a datastore client
const datastore = new Datastore();


const main = async () => {
    //fill me out!
    var year = 2019
    var json2 = require(`/Users/jonliu/Desktop/pairbulk/${year}.json`); //with path
    console.log(`Looking at cases filed in ${year}`)
    for (var i=0; i<json2.PatentData.length; i++) {
        let pCase = json2.PatentData[i].patentCaseMetadata

        try {
            let partyIdentifier = pCase.partyBag.applicantBagOrInventorBagOrOwnerBag;
            var partyIndex = 0;
            for (var j=0; j<partyIdentifier.length; j++){ 
                if (partyIdentifier[j].partyIdentifierOrContact) {
                    partyIndex = j;
                    break;
                }
            }
            const importantInfo = {
                statusDate: pCase.applicationStatusDate,
                status: pCase.applicationStatusCategory,
                applicationNo: pCase.applicationNumberText.value,
                attyDocket: pCase.applicantFileReference,
                lawFirm: pCase.partyBag.applicantBagOrInventorBagOrOwnerBag[partyIndex].partyIdentifierOrContact[0].name.personNameOrOrganizationNameOrEntityName[0].personStructuredName.lastName
            }

            importantInfo.lawFirm = 
            console.log(importantInfo)    
        } catch (err) {
            console.log(err)
        }
        if (i == 50) {
            break;
        }
    }
    

}


// main()

const saveContactlistToDatastore = async () => {
    const csvFilePath='./results/emails.csv'
    const csv=require('csvtojson')
    var jsonObj = await csv()
    .fromFile(csvFilePath)

    var entities = []
    for (var i=0; i<jsonObj.length; i++) {
        var coldEntity = jsonObj[i]
        const coldEmailKey = datastore.key(['coldEmail', coldEntity.email])
        coldEntity.didSend = false
        const entity = {
            key: coldEmailKey,
            data: coldEntity
        }
        entities.push(entity)
        if (entities.length >= 500 || i == jsonObj.length - 1) {
            await datastore.upsert(entities)
            console.log(`at ${i}, saved ${entities.length} to cloud`)
            entities = []
        }
    }
    return


}


// saveContactlistToDatastore() //careful running this; may overwrite data in table


const temp = async () => {
    const query = datastore.createQuery('coldEmail')
    const [recipients] = await datastore.runQuery(query);
    console.log(recipients.length + ' recipients...');
    var entities = []

    for (var i=0; i<recipients.length; i++) {
        var coldEntity = recipients[i]
        coldEntity.shouldSkip = false
        entities.push(coldEntity)
        if (entities.length >= 500 || i == recipients.length - 1) {
            await datastore.upsert(entities)
            console.log(`at ${i}, saved ${entities.length} to cloud`)
            entities = []
        }
    }

}
temp()
