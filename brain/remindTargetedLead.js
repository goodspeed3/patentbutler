const {Datastore} = require('@google-cloud/datastore');
// Instantiate a datastore client
const datastore = new Datastore();

const mailgun = require("mailgun-js");
const DOMAIN = 'mail.patentbutler.com';
const api_key = '395890d26aad6ccac5435c933c0933a3-9a235412-6950caab'
const mg = mailgun({apiKey: api_key, domain: DOMAIN});


const main = async () => {

    const query = datastore.createQuery('targetedOaRecipients')
    const [recipients] = await datastore.runQuery(query);
    var numDaysForReminder = 4;
    var maxReminders = 5;

    for (let recipient of recipients) {
        if (recipient.numReminders > maxReminders) {
            console.log(`${recipient.email} has been sent a max of ${recipient.numReminders} `)
            continue //don't send reminders to people too many times
        }
        //choose reminder time sent if it exists
        var lastEmailSentDate = new Date(recipient.reminderTimeSent || recipient.initialTimeSent)
        var minimumSendTime = new Date(lastEmailSentDate)
        minimumSendTime.setDate(minimumSendTime.getDate() + numDaysForReminder)
        
        if (Date.now() - minimumSendTime.getTime() > 0) {
            //should send reminder
            let nextReminderSendTime = getNextReminderSendTime(lastEmailSentDate, numDaysForReminder)
            console.log(`sending reminder for ${recipient.email} on ${nextReminderSendTime.toString()}, last sent ${lastEmailSentDate.toString()}`)

            const processedOaKey = datastore.key(['processedOa', recipient.filename]);
            const [processedOaEntity] = await datastore.get(processedOaKey);   
            
            const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
            const firstDate = new Date(processedOaEntity.mailingDate);
            firstDate.setMonth(firstDate.getMonth() + 3)
            
            const diffDays = Math.ceil((firstDate - nextReminderSendTime) / oneDay);
            /*
            var subject = `Reminder - ${processedOaEntity.attyDocket} - OA response due in ${diffDays} day${(diffDays > 1) ? 's' : ''} - Respond faster with this tool`

            if (diffDays <= 0) {
                subject = `Reminder - ${processedOaEntity.attyDocket} - OA response mailed ${processedOaEntity.mailingDate} - Respond faster with this tool`
            }*/
            var subject = 'Quick reminder'

            var templateNames = ['plain_reminder_target_oa_v1', 'rich_reminder_target_oa_v1']

            if (recipient.numReminders == maxReminders) {
                subject = 'Final reminder'
                templateNames = ['plain_final_reminder_target_oa_v1', 'rich_final_reminder_target_oa_v1']
            }

            //edit text here: https://app.mailgun.com/app/sending/domains/mail.patentbutler.com/templates
            var templateName = templateNames[Math.floor(Math.random() * templateNames.length)];
        
            //manually set template name
            // templateName = templateNames[1]
        
            let templateVar = {
                firstname: recipient.firstname,
                attyDocket: processedOaEntity.attyDocket,
                filename: processedOaEntity.filename,
                mailDate: processedOaEntity.mailingDate
            }
        
            console.log('Recipient: ' + recipient.email)
            console.log('Subject: ' + subject)
            console.log('Template: '+ templateName )
            console.log(templateVar)
        
            if (process.argv.length >= 3 && process.argv[2] == 'SEND') {

                const data = {
                    from: 'PatentButler Team <team@mail.patentbutler.com>',
                    to: recipient.email,
                    // to: 'jon@patentbutler.com', 
                    subject: subject,
                    template: templateName,
                    "h:X-Mailgun-Variables": JSON.stringify(templateVar),
                    "o:tag" : [templateName],
                    "o:deliverytime": nextReminderSendTime.toUTCString(),
                    "t:text" : "yes"
                };
                if (data.to.includes("patentbutler")) {
                    delete data["o:tag"] //don't track it
                    delete data["o:deliverytime"] //deliver it now if to pb
                }

                await mg.messages().send(data)    
                recipient.numReminders++
                recipient.reminderTimeSent = nextReminderSendTime
                await datastore.save(recipient)
            } else {
                console.log(`not yet sending to ${recipient.email}-- tell me to SEND if you want`)
            }
        } else {
            console.log(`not yet time to send reminder for ${recipient.email}; try again after ${minimumSendTime.toString()}`)

        }        
    }


}
const getNextReminderSendTime = (givenDate, numDaysToWait) => {
    let hourToSend = 9 + Math.floor(Math.random() * 5) //randomly send from 9am - 1pm
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


const temp = async () => {
    const query = datastore.createQuery('targetedOaRecipients')
    const [recipients] = await datastore.runQuery(query);
    console.log('Clearing reminder data...');
    for (let recipient of recipients) {
        recipient.numReminders = 0;
        delete recipient.reminderTimeSent
        await datastore.save(recipient)
    }
}
// temp()
