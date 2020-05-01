const {Datastore} = require('@google-cloud/datastore');
// Instantiate a datastore client
const datastore = new Datastore();
const getRandom = (arr, n) => {
    var result = new Array(n),
        len = arr.length,
        taken = new Array(len);
    if (n > len) {
        console.log("getRandom: more elements taken than available");
        return arr
    }
    while (n--) {
        var x = Math.floor(Math.random() * len);
        result[n] = arr[x in taken ? taken[x] : x];
        taken[x] = --len in taken ? taken[len] : len;
    }
    return result;
}

const main = async () => {
    let numberOfDailyEmails = 200

    const query = datastore.createQuery('coldEmail').filter('didSend', '=', false)
    const [recipients] = await datastore.runQuery(query);

    console.log(`picking ${numberOfDailyEmails} from ${recipients.length} random recipients`)

    const randomObjs = getRandom(recipients, numberOfDailyEmails)

    //edit text here: https://app.mailgun.com/app/sending/domains/mail.patentbutler.com/templates
    let subjectArray = [
        // 'Increase patent prosecution efficiency', 
        'Quick question', 
        // 'Reduce hours spent prosecuting patents',
        'A new cutting edge tool for patent practitioners',
        'New tool for patent prosecution',
        // 'Want to respond to your next office action more quickly?'
    ]
    let templateNames = ['cold-qvc', 'cold-demo-oa', 'cold-feedback']


    for (var i=0; i<randomObjs.length; i++) {
        var recipientObj = randomObjs[i]

        //TESTING
        // recipientObj.email = 'jon@patentbutler.com'

        var timeToSend = getNextWeekdayAM()
        var templateVar = {
            firstname: recipientObj.firstname,
            firm: recipientObj.firm
        }
        var subject = subjectArray[Math.floor(Math.random() * subjectArray.length)]
        var templateName = templateNames[Math.floor(Math.random() * templateNames.length)];
        //manually set template name
        // templateName = templateNames[2]

        console.log('Recipient: ' + recipientObj.email)
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
                to: recipientObj.email,
                subject: subject,
                template: templateName,
                "h:X-Mailgun-Variables": JSON.stringify(templateVar),
                "o:tag" : [templateName, subject, `hour-${timeToSend.getHours()}`],
                "o:deliverytime": timeToSend.toUTCString(),
                "t:text" : "yes"
              };
            if (recipientObj.email.includes("patentbutler")) {
                delete data["o:tag"] //don't track it
                delete data["o:deliverytime"] //deliver it now if to pb
            }
            if (process.argv.length == 4 && process.argv[3] == 'NOW') {
                delete data["o:deliverytime"]
                console.log(`sending email ${i} to ${recipientObj.email} NOW!`)
            } else {
                console.log(`sending email ${i} to ${recipientObj.email} at ${timeToSend.toString()}, fingers crossed!`)
            }
            let body = await mg.messages().send(data)
    
            //store in our db to track
            const coldEmailKey = datastore.key(['coldEmail', recipientObj.email]);
            coldEmailEntity = {
                ...recipientObj,
                initialTimeSent: timeToSend,
                lastTimeSent: timeToSend,
                numReminders: 0,
                numOpens: 0,
                numClicks: 0,
                didSend: true,
                msgId: body.id,
                template: templateName,
                subject: subject
            }
            const entity = {
                key: coldEmailKey,
                data: coldEmailEntity,
              };
            await datastore.upsert(entity)
            
            // console.log(entity)
            
        } else {
            console.log(`not yet sending to ${recipientObj.email} on ${timeToSend.toString()} -- tell me to SEND if you want`)
        }
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
    rightNow.setMinutes(Math.floor(Math.random() * 60)) //send at random time in hour
    return rightNow
}
main()
