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


main()
