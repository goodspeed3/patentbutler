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
    // const csvFilePath='./results/emails.csv'
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
        if (entities.length >= 500 || i == jsonObj.length - 1) {
            await datastore.insert(entities)
            console.log(`at ${i}, saved ${entities.length} to cloud`)
            entities = []
        }
    }
    return


}


// saveContactlistToDatastore() //careful running this; make sure emails don't exist already in table - will overwrite data in table


const temp = async () => {
    const query = datastore.createQuery('coldEmail').filter('didSend', '=', true)
    const [recipients] = await datastore.runQuery(query);
    console.log(recipients.length + ' recipients...');
    var entities = []

    for (var i=0; i<recipients.length; i++) {
        var coldEntity = recipients[i]
        // coldEntity.initialTimeSent = new Date(coldEntity.initialTimeSent)
        // coldEntity.lastTimeSent = new Date(coldEntity.lastTimeSent)
        // if (coldEntity.openTime) {
        //     coldEntity.openTime = new Date(coldEntity.openTime)
        // }
        // if (coldEntity.clickTime) {
        //     coldEntity.clickTime = new Date(coldEntity.clickTime)
        // }
        entities.push(coldEntity)

        if (entities.length >= 500 || i == recipients.length - 1) {
            await datastore.upsert(entities)
            console.log(`at ${i}, saved ${entities.length} to cloud`)
            entities = []
        }
    
    }

}
// temp()


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

const runMgAnalytics = async () => {
    const mailgun = require("mailgun-js");
    const DOMAIN = 'mail.patentbutler.com';
    const api_key = '395890d26aad6ccac5435c933c0933a3-9a235412-6950caab'
    const mg = mailgun({apiKey: api_key, domain: DOMAIN});
    
    let reminderSubjectTags = [
        'Quick reminder',
        'Reminder: A new cutting edge tool for patent practitioners',
        'Reminder: New tool for patent prosecution',
    ]
    let subjectTags = [
        'Quick question',
        'A new cutting edge tool for patent practitioners',
        'New tool for patent prosecution',
        // 'Want to respond to your next office action more quickly?',
        // 'Reduce hours spent prosecuting patents',
        // 'Increase patent prosecution efficiency'
    ]
    let templateTags = [
        'cold-demo-oa',
        'cold-qvc',
        'cold-feedback',
        'cold-demo-reminder-0',
        'cold-qvc-reminder-0',
        'cold-feedback-reminder-0',
        'cold-demo-reminder-1',
        'cold-qvc-reminder-1',
        'cold-feedback-reminder-1',
        'cold-tail-reminder',
        'cold-final-reminder',
    ]

    let hourTags = [
        'hour-9',
        'hour-10',
        'hour-11',
        'hour-12',
        'hour-13'
    ]

    let targetedTags = [
        'qvc-plain-text',
        'plain_reminder_target_oa_v1',
        'rich_target_oa_v1',
        'rich_reminder_target_oa_v1'
    ]

    let tagObj = {
        subject: subjectTags,
        reminderSubject: reminderSubjectTags,
        template: templateTags,
        hour: hourTags,
        targeted: targetedTags
    }
    for (let tagType in tagObj) {
        console.log(`------- Tag Type: ${tagType} ------`)
        for (let tagName of tagObj[tagType]) {
            var url = `/${DOMAIN}/tags/${encodeURIComponent(tagName)}/stats`
            var res = await mg.get(url, {"event": ['delivered', 'opened', 'clicked'], "duration": '7d'}).catch(e => console.log(`skipping ${tagName}`))
            if (res) {
                console.log(res.tag + ' =>')
                const totalObjs = {
                    delivered: 0,
                    openedTotal: 0,
                    openedUnique: 0,
                    clickedTotal: 0,
                    clickedUnique: 0,
                }

                for (var i=0; i<res.stats.length; i++) {           
                    var dayData = res.stats[i]
                    if (!dayData.delivered.total) {
                        continue
                    }
                    totalObjs.delivered += dayData.delivered.total
                    totalObjs.openedTotal += dayData.opened.total
                    totalObjs.openedUnique += dayData.opened.unique || 0
                    totalObjs.clickedTotal += dayData.clicked.total
                    totalObjs.clickedUnique += dayData.clicked.unique || 0

                    console.log(`${dayData.time.substring(0, 11)} | delivered: ${dayData.delivered.total} | opened total: ${dayData.opened.total} (${(100.0 * dayData.opened.total / dayData.delivered.total).toFixed(1)}%), unique: ${dayData.opened.unique || 0} (${(100.0 * (dayData.opened.unique || 0) / dayData.delivered.total).toFixed(1)}%) | clicked total: ${dayData.clicked.total} (${(100.0 * dayData.clicked.total / dayData.delivered.total).toFixed(1)}%), unique: ${dayData.clicked.unique || 0} (${(100.0 * (dayData.clicked.unique || 0) / dayData.delivered.total).toFixed(1)}%)`)
                }
                console.log('\x1b[36m%s\x1b[0m', `  SUMMARY  | delivered: ${totalObjs.delivered} | opened total: ${totalObjs.openedTotal} (${(100.0 * totalObjs.openedTotal / totalObjs.delivered).toFixed(1)}%), unique: ${totalObjs.openedUnique} (${(100.0 * (totalObjs.openedUnique) / totalObjs.delivered).toFixed(1)}%) | clicked total: ${totalObjs.clickedTotal} (${(100.0 * totalObjs.clickedTotal / totalObjs.delivered).toFixed(1)}%), unique: ${totalObjs.clickedUnique} (${(100.0 * (totalObjs.clickedUnique) / totalObjs.delivered).toFixed(1)}%)`)

                console.log()
            }
    
        }

        console.log('\n')
    }


}
runMgAnalytics()