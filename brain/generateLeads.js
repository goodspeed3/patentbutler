/*
Go to https://ped.uspto.gov/peds/#/search
refine it by 
Status = 'Non Final Action Mailed'
Status Date = 2020

Go to Public Pair for application
Download OA
Set up Demo
Find who signed the previous response
Email that person for a demo

*/

// var json2 = require('/Users/jonliu/Desktop/pairbulk/2018.json'); //with path
// console.log(json2)


const bucketName = 'crafty-valve-269403.appspot.com';
const {Datastore} = require('@google-cloud/datastore');
// Instantiate a datastore client
const datastore = new Datastore();


const main = async () => {
    //fill me out!
    var obj = {
        firstname: "Ashley",
        recipientEmail: 'ashley.pezzner@faegredrinker.com',
        // recipientEmail: 'jon+1@patentbutler.com',
        filename: "jf8-KavKwccqJa6NAHGv1.pdf"
    }
    
    
    const processedOaKey = datastore.key(['processedOa', obj.filename]);
    const [processedOaEntity] = await datastore.get(processedOaKey);
    obj.attyDocket = processedOaEntity.attyDocket
    obj.mailDate = processedOaEntity.mailingDate
    
    
    const oneDay = 24 * 60 * 60 * 1000; // hours*minutes*seconds*milliseconds
    const firstDate = new Date(obj.mailDate);
    firstDate.setMonth(firstDate.getMonth() + 3)
    const secondDate = Date.now();
    
    const diffDays = Math.ceil(Math.abs((firstDate - secondDate) / oneDay));
    let subject = `${obj.attyDocket} OA response due in ${diffDays} day${(diffDays > 1) ? 's' : ''} - Try Demo`
    let text = `Hi ${obj.firstname},<br/><br/>
    
    Hope you're staying safe during these turbulent times!<br/><br/>
    
    At PatentButler, we're building a faster way to respond to office actions.  The tool pulls together art cited inside office actions and allows you to quickly navigate to each citation.  <br /><br />
    
    Take a look on your laptop or desktop: <a href='https://patentbutler.com/demo/${obj.filename}'>${obj.attyDocket} - Office Action Demo</a>.<br /><br />
    
    We'd love to hear whether this experience was helpful for you in responding to the office action.  Let me know if you have any questions as well.<br /><br />
    
    Thanks for reading,<br />
    Jon<br /><br/>
    
    ------------<br /><small style='color:gray'>* We hope you found this email useful.  If you'd rather not receive emails like this in the future, please reply with 'Stop'<br />* PatentButler | 632 True Wind Way, Unit 609, Redwood City, CA 94063</small>
    `
    console.log('Recipient: ' + obj.recipientEmail)
    console.log('Subject: ' + subject)
    console.log('Body:\n'+text)
    
    if (process.argv.length == 3 && process.argv[2] == 'SEND') {
        const mailgun = require("mailgun-js");
        const DOMAIN = 'mail.patentbutler.com';
        const api_key = '395890d26aad6ccac5435c933c0933a3-9a235412-6950caab'
        const mg = mailgun({apiKey: api_key, domain: DOMAIN});
        console.log(`sending email at ${getNextAM()}, fingers crossed!`)
        const data = {
            from: 'Jon Liu <jon@patentbutler.com>',
            to: obj.recipientEmail,
            subject: subject,
            html: text,
            "o:tag" : ['targeted OA v1'],
            "o:deliverytime": getNextAM()
          };
      
        mg.messages().send(data)
        
    }
    console.log('-- node generateLeads.js SEND --')
}
const getNextAM = () => {
    var rightNow = new Date()
    if (rightNow.getHours() < 7 && rightNow.getMinutes() < 20) { //b/w midnight and 720
        rightNow.setHours(7)
    } else { // b/w 720 and midnight, send the next morning
        rightNow.setDate(rightNow.getDate()+1) 
        rightNow.setHours(7)
    }
    return rightNow.toUTCString()
}
main()
