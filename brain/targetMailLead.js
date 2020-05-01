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

// var json2 = require('/Users/jonliu/Desktop/pairbulk/2018.json'); //with path
// console.log(json2)


const {Datastore} = require('@google-cloud/datastore');
// Instantiate a datastore client
const datastore = new Datastore();


const main = async () => {
    //fill me out!
    var obj = {
        firstname: "Jon",
        // recipientEmail: 'hakhavannik@bakerlaw.com',
        recipientEmail: 'jwliu00@yahoo.com',
        filename: "LU9JaKv9HajVos8yEBBFO.pdf"
    }
    
    
    const processedOaKey = datastore.key(['processedOa', obj.filename]);
    const [processedOaEntity] = await datastore.get(processedOaKey);
    obj.attyDocket = processedOaEntity.attyDocket
    obj.mailDate = processedOaEntity.mailingDate
    
    
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const firstDate = new Date(obj.mailDate);
    firstDate.setMonth(firstDate.getMonth() + 3)
    var timeToSend = getNextWeekdayAM()
    var secondDate = new Date(timeToSend);
    if (process.argv.length == 4 && process.argv[3] == 'NOW') {
        secondDate = Date.now();
    }
    
    const diffDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
    let subject1 = `${obj.attyDocket} - OA response due in ${diffDays} day${(diffDays > 1) ? 's' : ''} - Respond faster with this tool`
    //edit text here: https://app.mailgun.com/app/sending/domains/mail.patentbutler.com/templates
    let subject2 = `Quick question`
    let subjectArray = [subject1, subject2]
    // let subject = subjectArray[Math.floor(Math.random() * subjectArray.length)]
    // don't confound the test yet with different subjects
    let subject = subject1

    let templateNames = ['plain_target_oa_v1', 'rich_target_oa_v1', 'qvc-plain-text']
    var templateName = templateNames[Math.floor(Math.random() * templateNames.length)];

    //manually set template name
    // templateName = templateNames[2]

    var templateVar = {
        firstname: obj.firstname,
        attyDocket: obj.attyDocket,
        filename: obj.filename,
        mailDate: obj.mailDate
    }

    console.log('Recipient: ' + obj.recipientEmail)
    console.log('Subject: ' + subject)
    console.log('Template: '+ templateName )
    console.log(templateVar)
    
    if (process.argv.length >= 3 && process.argv[2] == 'SEND') {
        const mailgun = require("mailgun-js");
        const DOMAIN = 'mail.patentbutler.com';
        const api_key = '395890d26aad6ccac5435c933c0933a3-9a235412-6950caab'
        const mg = mailgun({apiKey: api_key, domain: DOMAIN});
        const data = {
            from: 'PatentButler Team <team@mail.patentbutler.com>',
            to: obj.recipientEmail,
            subject: subject,
            template: templateName,
            "h:X-Mailgun-Variables": JSON.stringify(templateVar),
            "o:tag" : [templateName],
            "o:deliverytime": timeToSend.toUTCString(),
            "t:text" : "yes"
          };
        if (obj.recipientEmail.includes("patentbutler")) {
            delete data["o:tag"] //don't track it
            timeToSend = (new Date())
        }
        if (process.argv.length == 4 && process.argv[3] == 'NOW') {
            delete data["o:deliverytime"]
            console.log(`sending email to ${obj.recipientEmail} NOW!`)
        } else {
            console.log(`sending email to ${obj.recipientEmail} at ${timeToSend.toString()}, fingers crossed!`)
        }
        let body = await mg.messages().send(data)

        //store in our db to track
        const targetedOaRecipientsKey = datastore.key(['targetedOaRecipients', obj.recipientEmail]);
        targetedOaRecipientsEntity = {
            email: obj.recipientEmail,
            initialTimeSent: timeToSend,
            numReminders: 0,
            numOpens: 0,
            numClicks: 0,
            oaMailDate: obj.mailDate,
            firstname: obj.firstname,
            msgId: body.id,
            template: templateName,
            filename: obj.filename
        }
        const entity = {
            key: targetedOaRecipientsKey,
            data: targetedOaRecipientsEntity,
          };
        await datastore.upsert(entity)
        
        console.log(targetedOaRecipientsEntity)
        
    }
}
const getNextWeekdayAM = () => {
    var rightNow = new Date()
    let hourToSend = 9 + Math.floor(Math.random() * 5) //randomly send from 9am - 1pm
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
    return rightNow
}
main()
