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