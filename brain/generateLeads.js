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
    const csvFilePath='./results/emails-round2.csv'
    const csv=require('csvtojson')
    var jsonObj = await csv()
    .fromFile(csvFilePath)

    var entities = []
    for (var i=0; i<jsonObj.length; i++) {
        var coldEntity = jsonObj[i]
        const coldEmailKey = datastore.key(['coldEmail', coldEntity.email])
        coldEntity.didSend = false
        coldEntity.shouldSkip = false
        const entity = {
            key: coldEmailKey,
            data: coldEntity
        }
        entities.push(entity)
        console.log('adding ' + coldEntity.email)
        if (entities.length >= 500 || i == jsonObj.length - 1) {
            await datastore.insert(entities).catch(e => console.log(e))
            console.log(`at ${i}, saved ${entities.length} to cloud`)
            entities = []
        }
    }
    return


}


// saveContactlistToDatastore() //careful running this; make sure emails don't exist already in table - will overwrite data in table


const temp = async () => {
    const query = datastore.createQuery('coldEmail').filter('firm', '=', 'SLATER & MATSIL, LLP')
    const [recipients] = await datastore.runQuery(query);
    console.log(recipients.length + ' recipients...');
    var entities = []

    for (var i=0; i<recipients.length; i++) {
        var coldEntity = recipients[i]
        coldEntity.firm = 'Slater & Matsil'
        entities.push(coldEntity)

        if (entities.length >= 500 || i == recipients.length - 1) {
            await datastore.upsert(entities)
            console.log(`at ${i}, saved ${entities.length} to cloud`)
            entities = []
        }
    
    }

}
// temp()

const temp2 = async () => {
    const query = datastore.createQuery('user')
    const [users] = await datastore.runQuery(query);
    console.log(users.length + ' users...');
    var entities = []
    var listOfFreeDomains = ["gmail.com", "yahoo.com", "hotmail.com", "aol.com", "outlook.com"]
  
    for (var i=0; i<users.length; i++) {
        var user = users[i]
        var firmData = listOfFreeDomains.includes(user[datastore.KEY].name.split("@")[1]) ? user[datastore.KEY].name : user[datastore.KEY].name.split("@")[1]        
        user.firm = firmData
        entities.push(user)

        if (entities.length >= 500 || i == users.length - 1) {
            await datastore.upsert(entities)
            console.log(`at ${i}, saved ${entities.length} to cloud`)
            console.log(entities)

            entities = []
        }
    
    }
}
temp2()

const getNextWeekdayAM = () => {
    var rightNow = new Date()
    let hourToSend = 9
    if (rightNow.getDay() >=5) {
        let numOfDaysUntilMonday = 7 - rightNow.getDay()
        rightNow.setDate(rightNow.getDate() + numOfDaysUntilMonday)
        rightNow.setHours(hourToSend)
    }


    if (rightNow.getHours() < hourToSend && rightNow.getMinutes() < 20) { //b/w midnight and hourToSend:20
        rightNow.setHours(hourToSend)
    } else { // b/w 720 and midnight, send the next morning
        rightNow.setDate(rightNow.getDate()+1) 
        rightNow.setHours(hourToSend)
    }
    rightNow.setMinutes(Math.floor(Math.random() * 60)) //send at random time in hour
    return rightNow
}

const getOAFromPTO = async () => {
    //curl -X POST --header 'Content-Type: application/x-www-form-urlencoded' --header 'Accept: application/json' -d 'criteria=patentApplicationNumber%3A13261940&start=0&rows=100' 'https://developer.uspto.gov/ds-api/oa_actions/v1/records'

    const axios = require('axios').default;
    const params = new URLSearchParams();
    params.append('criteria', 'patentApplicationNumber:13738796');

    axios.post('https://developer.uspto.gov/ds-api/oa_actions/v1/records', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }).then((res) => {
        let ptoResponse = res.data.response.docs
        var recentOa;
        var mostRecentMillisecond = 0;
        for (let oa of ptoResponse) {
            var timeInMs = new Date(oa.submissionDate).getTime();
            if (timeInMs > mostRecentMillisecond) {
                recentOa = oa
                mostRecentMillisecond = timeInMs
            }
        }
        console.log(recentOa["sections.section103RejectionText"][0])
        console.log()
        console.log(recentOa["sections.section112RejectionText"][0])
        console.log()
        console.log(recentOa.bodyText[0])
    }).catch((e) => {
        console.log(e)
    })

}

// getOAFromPTO()