const {Datastore} = require('@google-cloud/datastore');
// Instantiate a datastore client
const datastore = new Datastore();

const mailgun = require("mailgun-js");
const DOMAIN = 'mail.patentbutler.com';
const api_key = '395890d26aad6ccac5435c933c0933a3-9a235412-6950caab'
const mg = mailgun({apiKey: api_key, domain: DOMAIN});


const main = async () => {
    let numDaysForReminder = 4;
    let maxReminders = 5;

    var sendCutoffDate = new Date()
    sendCutoffDate.setDate(sendCutoffDate.getDate() - numDaysForReminder)

    var query = datastore.createQuery('coldEmail')
        .filter('shouldSkip', '=', false)
        .filter('lastTimeSent', '<', sendCutoffDate)

    //TESTING
    // query = datastore.createQuery('coldEmail')
    //     .filter('shouldSkip', '=', false)
    //     .filter('lastTimeSent', '>', new Date())

    const [recipients] = await datastore.runQuery(query);

    console.log(`sending reminder to ${recipients.length} recipients because last reminder was sent before ${sendCutoffDate.toString()}...`)

    for (var i=0; i<recipients.length; i++) {
        var recipient = recipients[i]
        if (recipient.numReminders > maxReminders) {
            console.log(`${recipient.email} has been sent a max of ${recipient.numReminders} `)
            continue //don't send reminders to people too many times
        }

        //should send reminder
        let nextReminderSendTime = getNextReminderSendTime(recipient.lastTimeSent, numDaysForReminder)
        console.log(`sending reminder for ${recipient.email} on ${nextReminderSendTime.toString()}, last sent ${recipient.lastTimeSent.toString()}`)

        let subjectArray = ['Reminder: Increase patent prosecution efficiency', 
        'Quick reminder', 
        'Reminder: Reduce hours spent prosecuting patents',
        'Reminder: A new cutting edge tool for patent practitioners',
        'Reminder: New tool for patent prosecution',
        'Reminder: A faster way to prosecute patents with PatentButler'
        ]
        var subject = subjectArray[Math.floor(Math.random() * subjectArray.length)]

        //we'll need *-0 and *-1 templates
        var templateName;
        if (recipient.template.includes("demo")) {
            //go demo route
            templateName = `cold-demo-reminder-${recipient.numReminders}`
        } else {
            //go qvc route
            templateName = `cold-qvc-reminder-${recipient.numReminders}`
        }

        if (recipient.numReminders >= 2) {
            templateName = 'cold-tail-reminder'
        }

        if (recipient.numReminders == maxReminders) {
            subject = 'FINAL ' + subject
            templateName = 'cold-final-reminder'
        }

    
        //manually set template name
        // templateName = templateNames[1]
    
        let templateVar = {
            firstname: recipient.firstname,
            firm: recipient.firm
        }
    
        console.log('Recipient: ' + recipient.email)
        console.log('Subject: ' + subject)
        console.log('Template: '+ templateName + ' - orig template: ' + recipient.template)
        console.log(templateVar)
    
        if (process.argv.length >= 3 && process.argv[2] == 'SEND') {

            const data = {
                from: 'PatentButler Team <team@mail.patentbutler.com>',
                to: recipient.email,
                // to: 'jon@patentbutler.com', 
                subject: subject,
                template: templateName,
                "h:X-Mailgun-Variables": JSON.stringify(templateVar),
                "o:tag" : [templateName, subject],
                "o:deliverytime": nextReminderSendTime.toUTCString(),
                "t:text" : "yes"
            };
            if (data.to.includes("patentbutler")) {
                delete data["o:tag"] //don't track it
                delete data["o:deliverytime"] //deliver it now if to pb
            }

            await mg.messages().send(data)    
            recipient.numReminders++
            recipient.reminderTimeSent = nextReminderSendTime.toString()
            recipient.lastTimeSent = nextReminderSendTime.toString()
            await datastore.save(recipient)
        } else {
            console.log(`not yet sending to ${recipient.email}-- tell me to SEND if you want`)
        }     
    }


}
const getNextReminderSendTime = (givenDate, numDaysToWait) => {
    let hourToSend = 9
    var tempDate = new Date(givenDate)
    tempDate.setDate(tempDate.getDate() + numDaysToWait)
    if (tempDate.getDay() >=5 || tempDate.getDay() == 0) {
        let numOfDaysUntilMonday = (tempDate.getDay() == 0) ? 0 : 7 - tempDate.getDay()
        tempDate.setDate(tempDate.getDate() + numOfDaysUntilMonday)
        tempDate.setHours(hourToSend)
    }


    if (tempDate.getHours() < hourToSend && tempDate.getMinutes() < 20) { //b/w midnight and hourToSend:20
        tempDate.setHours(hourToSend)
    } else { // b/w 720 and midnight, send the next morning
        tempDate.setDate(tempDate.getDate()+1) 
        tempDate.setHours(hourToSend)
    }
    tempDate.setMinutes(Math.floor(Math.random() * 60)) //send at random time in hour

    return tempDate
}
main()
