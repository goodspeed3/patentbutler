import React, {useState, useEffect} from 'react';
import './process.css'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
const shortid = require('shortid');

function OaInput (props) {
  let { fileData, oaObject, setOaObject, setShowPriorArt, savePaToCloud, priorArtList, setPriorArtList, rejectionList, setRejectionList } = props
  let { filename, user:email } = fileData
  const [applicationNumber, setApplicationNumber] = useState('')
  const [attyDocket, setAttyDocket] = useState('')
  const [mailingDate, setMailingDate] = useState('')
  const [filingDate, setFilingDate] = useState('')
  const [show, setShow] = useState(false);
  const [validated, setValidated] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const [uniquePubNumList, setUniquePubNumList] = useState([]);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    const newUniquePubNumList =[]
    for (var i=0; i<rejectionList.length; i++) {
      const rejection = rejectionList[i]
      if (!rejection.claimArgumentList) continue
      for (var j=0; j<rejection.claimArgumentList.length; j++) {
        const claimArgument = rejection.claimArgumentList[j]
        if (!claimArgument.citationList) continue
        for (var k=0; k<claimArgument.citationList.length; k++) {
          const citationObj = claimArgument.citationList[k]
          //keep track of unique pub nums 
          if (!newUniquePubNumList.some(o => o===citationObj.publicationNumber)) {
            newUniquePubNumList.push(citationObj.publicationNumber)
          }
        }
      }
    }
    setUniquePubNumList(newUniquePubNumList)
    

    // setPriorArtList(pa => {
    //   if (Object.keys(pa).length === 0) return {}

    //   //copy citations over
    //   var newCitationList=[]
    //   for (var i=0; i<rejectionList.length; i++) {
    //     const rejection = rejectionList[i]
    //     if (!rejection.claimArgumentList) continue
    //     for (var j=0; j<rejection.claimArgumentList.length; j++) {
    //       const claimArgument = rejection.claimArgumentList[j]
    //       if (!claimArgument.citationList) continue
    //       for (var k=0; k<claimArgument.citationList.length; k++) {
    //         const citationObj = claimArgument.citationList[k]
  
    //         var newObj = {
    //           ...citationObj,
    //           overlayAdded: false
    //         }
    //         newCitationList.push(newObj)
    //       }
    //     }
    //   }

    //   for (i=0; i<newCitationList.length; i++) {
    //     var citationObj = newCitationList[i]
    //     //now iterate over paObjects to copy over relevant data
    //     for (j=0; j<pa.paObjects.length; j++) {
    //       const paObject = pa.paObjects[j]
    //       debugger
    //       if (citationObj.publicationNumber ===paObject.publicationNumber) {
    //         //only add to list if it doesn't already exist
    //         let tCit = citationObj.citation
    //         if (!paObject.citationList.some(o => o.citation === tCit )) {
    //           paObject.citationList.push(citationObj)
    //         }
    //       }
    //     }

    //   }

    //   return {
    //     ...pa,
    //   }

    // })



  }, [rejectionList, setUniquePubNumList])
  
  const addRejection = () => {
    const newRejection = {
      type: 'exrem', //it's the first default rejection
      typeText: 'Examiner Remarks',
      claimArgumentList: [],
      blurb: '',
      id: shortid.generate()
    }

    rejectionList.push(newRejection)
    //needs ... to trigger update of array
    setRejectionList([...rejectionList])
  }
  const removeRejection = (index) => {
    rejectionList.splice(index, 1)
    //needs ... to trigger update of array
    setRejectionList([...rejectionList])
  }
  const setRejType = (index, value) => {
    rejectionList[index].type = value
    switch(value) {
      case 'exrem':
        rejectionList[index].typeText = 'Examiner Remarks'
        break;
      case '101':
        rejectionList[index].typeText = '§ 101 Rejection'
        break;
      case '112':
        rejectionList[index].typeText = '§ 112 Rejection'
        break;
      case '102':
        rejectionList[index].typeText = '§ 102 Rejection'
        break;
      case '103':
        rejectionList[index].typeText = '§ 103 Rejection'
        break;
      case 'other':
        rejectionList[index].typeText = 'Other'
        break;
      default:
        console.log('error rej type')
    }    
    setRejectionList([...rejectionList])
  }
  const setBlurb = (index, value) => {
    rejectionList[index].blurb = value
    setRejectionList([...rejectionList])
  }


  const rejectionListElements = () => {
    return rejectionList.map((rejection, index) => {
      let elements = (
        <div key={rejection.id}>
        <Form.Row  >
          <Form.Group as={Col} md={2}><Form.Label><b>Rejection Type:</b></Form.Label></Form.Group>
        <Form.Group as={Col} md={2}>
        <Form.Control size='sm' as="select" onChange={(e) => setRejType(index, e.target.value)} value={rejection.type}>
            <option value='exrem'>Ex. Remarks</option>
            <option value='101'>101</option>
            <option value='112'>112</option>
            <option value='102'>102</option>
            <option value='103'>103</option>
            <option value='other'>Other</option>

          </Form.Control>
        </Form.Group>
        <Form.Group md={3} as={Col}>
          <Button size='sm' variant="warning" onClick={() => removeRejection(index)}>Remove</Button>
        </Form.Group>
        </Form.Row>
        { rejection.type !== '102' && rejection.type !== '103' ? 
        <Form.Group >
          <Form.Label>Blurb</Form.Label>
          <Form.Control required as="textarea" rows="3" onChange={(e) => setBlurb(index, e.target.value)} value={rejection.blurb} />
        </Form.Group>
        :
        claimArgumentListElements(index)
        }
        </div>
      );

      return elements
      
    }
    )

  }
  const removeClaimArgument = (rejectionIndex, claimArgIndex) => {
    let rejection = rejectionList[rejectionIndex]
    rejection.claimArgumentList.splice(claimArgIndex, 1)
    
    //needs a new object to trigger update of array
    setRejectionList(JSON.parse(JSON.stringify(rejectionList)))
  }
  
  const addClaimArgument = (rejectionIndex) => {
    let rejection = rejectionList[rejectionIndex]
    rejection.claimArgumentList.push({
      number: '', //elements where number is '' will not be saved to server
      snippetText: '', //onsubmit, will convert all snippets into snippetList, kept in this form for now due to ease of removal / addition
      examinerText: '',
      citationList: [],
      id: shortid.generate()
    })
    //needs a new object to trigger update of array
    setRejectionList(JSON.parse(JSON.stringify(rejectionList)))
  }
  const changeClaimArg = (rejectionIndex, claimArgIndex, value, field) => {
    let rejection = rejectionList[rejectionIndex]
    let claimArg = rejection.claimArgumentList[claimArgIndex]
    claimArg[field] = value;
    //needs a new object to trigger update of array
    setRejectionList(JSON.parse(JSON.stringify(rejectionList)))
  }


  const claimArgumentListElements = (rejectionIndex) => {
    let rejection = rejectionList[rejectionIndex]
    if (rejection.claimArgumentList.length === 0) {
      addClaimArgument(rejectionIndex)
    }
    return rejection.claimArgumentList.map((claimRejection, index) => {
      // onChange={(e) => setBlurb(index, e.target.value)} value={rejection.blurb}
      return (<div key={claimRejection.id}>
        <Form.Row  >
        <Form.Group md={1} as={Col} >
          <Form.Label><u>Claim</u></Form.Label>
          <Form.Control required size='sm' name={"claim"+index} type="text" value={claimRejection.number} onChange={(e) => changeClaimArg(rejectionIndex, index, e.target.value, 'number')} />
        </Form.Group>
        <Form.Group as={Col} md={5} >
          <Form.Label><u>Claim Snippet</u></Form.Label>
          <Form.Control required size='sm' as="textarea" rows="2" value={claimRejection.snippetText} onChange={(e) => changeClaimArg(rejectionIndex, index, e.target.value, 'snippetText')} />
        </Form.Group>
        <Form.Group md={4} as={Col} >
          <Form.Label><u>Examiner Remarks</u></Form.Label>
          <Form.Control required size='sm' as="textarea" rows="2"  value={claimRejection.examinerText} onChange={(e) => changeClaimArg(rejectionIndex, index, e.target.value, 'examinerText')} />
        </Form.Group>
        <Form.Group md={2} as={Col}>
          <Button size='sm' variant={index !== rejection.claimArgumentList.length - 1 ? "outline-danger" : "outline-success"} onClick={index !== rejection.claimArgumentList.length - 1 ? () => removeClaimArgument(rejectionIndex, index) : () => addClaimArgument(rejectionIndex)}>{index !== rejection.claimArgumentList.length - 1 ? '-Snip' : '+Snip'}</Button>
        </Form.Group>
        </Form.Row>
        {citationListElements(rejectionIndex, index)}
                
      </div>)
    })
  }
  const addCitation = (rejectionIndex, claimArgIndex, prevPubNum = '') => {
    let rejection = rejectionList[rejectionIndex]
    rejection.claimArgumentList[claimArgIndex].citationList.push({
      citation: '',  //empty citations will be ignored by server
      publicationNumber: prevPubNum,
      id: shortid.generate()
    })
    //needs a new object to trigger update of array
    setRejectionList(JSON.parse(JSON.stringify(rejectionList)))
  }
  const removeCitation = (rejectionIndex, claimArgIndex, citationIndex) => {
    let citationList = rejectionList[rejectionIndex].claimArgumentList[claimArgIndex].citationList
    citationList.splice(citationIndex, 1)
    
    //needs a new object to trigger update of array
    setRejectionList(JSON.parse(JSON.stringify(rejectionList)))
  }

  const changeCitation = (rejectionIndex, claimArgIndex, citationIndex, value, field) => {
    let rejection = rejectionList[rejectionIndex]
    let citationObj = rejection.claimArgumentList[claimArgIndex].citationList[citationIndex]
    if (field === 'publicationNumber' && Object.keys(priorArtList).length > 0) {
      var oldPubNum = citationObj[field]
      //update the pub number in priorArtList
      for (var i=0; i<priorArtList.paObjects.length; i++) {
        var paObj = priorArtList.paObjects[i]
        if (paObj.publicationNumber === oldPubNum) {
          paObj.publicationNumber = value
        }
      }
      setPriorArtList(JSON.parse(JSON.stringify(priorArtList)))
    }
    citationObj[field] = value;
    //needs a new object to trigger update of array
    setRejectionList(JSON.parse(JSON.stringify(rejectionList)))

  }


  const citationListElements = (rejectionIndex, claimArgIndex) => {
    let rejection = rejectionList[rejectionIndex]
    if (rejection.claimArgumentList[claimArgIndex].citationList.length === 0) {
      addCitation(rejectionIndex, claimArgIndex)
    }
    return rejection.claimArgumentList[claimArgIndex].citationList.map((citation, index) => {
      // onChange={(e) => setBlurb(index, e.target.value)} value={rejection.blurb}
      return (<div key={citation.id}>
        <Form.Row  >
        <Form.Group as={Col} md={1} >
        </Form.Group>
        <Form.Group as={Col} md={5} >
          <Form.Label>Citation</Form.Label>
          <Form.Control required size='sm' type="text" placeholder="citation should match ex remarks" value={citation.citation} onChange={(e) => changeCitation(rejectionIndex, claimArgIndex, index, e.target.value, 'citation')} />
        </Form.Group>
        <Form.Group md={4} as={Col} >
          <Form.Label>Publication Number</Form.Label>
          <Form.Control required size='sm' type="text" placeholder="USxxxxxxxxxxx" value={citation.publicationNumber} onChange={(e) => changeCitation(rejectionIndex, claimArgIndex, index, e.target.value, 'publicationNumber')}/>
        </Form.Group>
        <Form.Group md={2} as={Col}>
          <Button size='sm' variant={index !== rejection.claimArgumentList[claimArgIndex].citationList.length - 1 ? "outline-danger" : "outline-success"} onClick={index !== rejection.claimArgumentList[claimArgIndex].citationList.length - 1 ? () => removeCitation(rejectionIndex, claimArgIndex, index) : () => addCitation(rejectionIndex, claimArgIndex, citation.publicationNumber)}>{index !== rejection.claimArgumentList[claimArgIndex].citationList.length - 1 ? '-Cit' : '+Cit'}</Button>
        </Form.Group>
        </Form.Row>
                
      </div>)
    })
  }  

  const handleChange = (e, index, property) => {
    const t = e.target
    switch(t.name) {
      case 'applicationNumber': 
      //applicationnumber length needed for deletions
        if (t.value.length === 2 && applicationNumber.length === 1)
          t.value= t.value+'/'
        if (t.value.length === 6 && applicationNumber.length === 5)
          t.value= t.value+','
        setApplicationNumber(t.value)
        break;
      case 'attyDocket':
        setAttyDocket(t.value)
        break;
      case 'mailingDate':
        if ((t.value.length === 2 && mailingDate.length === 1) || (t.value.length === 5 && mailingDate.length === 4))
          t.value= t.value+'/'
        setMailingDate(t.value)
        break;
      case 'filingDate':
        if ((t.value.length === 2 && filingDate.length === 1) || (t.value.length === 5 && filingDate.length === 4))
          t.value= t.value+'/'
        setFilingDate(t.value)
        break;
      case 'priorArtObj':
        priorArtList.paObjects[index][property] = t.value
        setPriorArtList(JSON.parse(JSON.stringify(priorArtList)))
        break;
      default: 
        console.log('should not reach')
    }
  }
  const handleSubmit = (e) => {
    console.log('rejectionlist')
    console.log(rejectionList)
    console.log('palist')
    console.log(priorArtList)
    const form = e.currentTarget;
    if (form.checkValidity() === false) {
      e.preventDefault();
      e.stopPropagation();
    }
    setValidated(true);

    handleShow()
    e.preventDefault()
    e.stopPropagation();
  }

  const finalizeRejectionList = () => {
     var obj = {
      finishedProcessingTime: Date.now(),
      filename: filename,
      user: email,
      mailingDate: mailingDate,
      filingDate: filingDate,
      applicationNumber: applicationNumber,
      attyDocket: attyDocket,
      rejectionList: rejectionList,
      priorArtList: priorArtList.paObjects
    }

    return JSON.stringify(obj, null, 2)
  }

  const saveOaObj = () => {
    // setOaObject(finalizedOaObject)
    handleClose()
  }

  const handlePaUpload = async (e) => {
    var formData = new FormData();
    for (var i=0; i<e.target.files.length; i++) {
        let file = e.target.files[i]
        formData.append('paList', file);
    }
    formData.append('userEmail', email);
    setShowLoading(true)
    let res = await savePaToCloud(formData)
    setShowLoading(false)
    if (uniquePubNumList.length > 0) {
      console.log(uniquePubNumList)
      for (i=0; i<res.paObjects.length; i++) {
        var paObj = res.paObjects[i]
        paObj.publicationNumber = uniquePubNumList[0]
      }  
    }
    console.log(res)
    setPriorArtList(res)
    setShowPriorArt(true)
  }


  const showPriorArtElements = () => {
    if (priorArtList.files && priorArtList.files.length > 0) {
      return <>
      <Form.Text className="text-muted">Don't forget to draw the cited areas.</Form.Text>
      {priorArtList.files.map((paFile, index) =>
        <div key={paFile.filename}>
          <Form.Row>
          <Form.Label style={{marginTop: '1rem'}}><b>{paFile.originalname}</b></Form.Label>
          </Form.Row>
          <Form.Row>
          <Form.Group as={Col}>
              <Form.Label>Abbreviation</Form.Label>
              <Form.Control required size='sm' name="priorArtObj" type="text" placeholder="Marks" value={priorArtList.paObjects[index].abbreviation} onChange={(e) => handleChange(e, index, 'abbreviation')} />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Publication Number</Form.Label>
              <Form.Control required size='sm' name="priorArtObj" value={priorArtList.paObjects[index].publicationNumber} as="select"  onChange={(e) => handleChange(e, index, 'publicationNumber')}>
                {uniquePubNumList.map((pubNum) => 
                    <option key={pubNum} value={pubNum}>{pubNum}</option>)}
              </Form.Control>
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Assignee</Form.Label>
              <Form.Control required size='sm' name="priorArtObj" value={priorArtList.paObjects[index].assignee} type="text" placeholder="Sony Interactive Entertainment, Inc."  onChange={(e) => handleChange(e, index, 'assignee')} />
            </Form.Group>            
          </Form.Row>
          <Form.Row>
            <Form.Label>Title</Form.Label>
            <Form.Control required size='sm' type="text" name="priorArtObj" placeholder="Methods and Apparatus..." value={priorArtList.paObjects[index].title} onChange={(e) => handleChange(e, index, 'title')} />
          </Form.Row>
        </div>
      )
      }
      </>
    } 
  }

    return <div className='formSubmission'>
  <Form onSubmit={handleSubmit} validated={validated} >
  <Form.Row>
  <Form.Group as={Col} >
      <Form.Label>Application No</Form.Label>
      <Form.Control required size='sm' name="applicationNumber" type="text" placeholder="xx/yyy,yyy" value={applicationNumber} onChange={handleChange} />
    </Form.Group>
    <Form.Group as={Col} >
      <Form.Label>Attorney Docket</Form.Label>
      <Form.Control required size='sm' name="attyDocket" value={attyDocket} type="text" placeholder="Enter docket"  onChange={handleChange} />
    </Form.Group>
  </Form.Row>

  <Form.Row>
  <Form.Group as={Col} >
      <Form.Label>Mail Date</Form.Label>
      <Form.Control required size='sm' name="mailingDate" type="text" value={mailingDate} placeholder="MM/DD/YYYY"  onChange={handleChange} />
    </Form.Group>
    <Form.Group as={Col} >
      <Form.Label>Filing Date</Form.Label>
      <Form.Control required size='sm' name="filingDate" type="text" value={filingDate} placeholder="MM/DD/YYYY"  onChange={handleChange} />
    </Form.Group>
  </Form.Row>
  {rejectionListElements()}
  <Button variant="info" onClick={addRejection}>
    Add Rejection
  </Button>
  <hr />
  <div className='paUpload'>Upload Cited Art: &nbsp;
    <Form.Group >
    <Form.Control
        type="file"
        onChange={handlePaUpload}
        accept=".pdf"
        multiple
    />
    </Form.Group>
  { showLoading ? <Spinner animation="border" /> : null}
  </div>  
  {showPriorArtElements()}
  <Button className='submitButton' variant="primary" type="submit">
    Save
  </Button>
</Form>
  <Modal show={show} onHide={handleClose}>
    <Modal.Header closeButton>
      <Modal.Title>Verify</Modal.Title>
    </Modal.Header>
    <Modal.Body><pre>{finalizeRejectionList()}</pre></Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={handleClose}>
        Close
      </Button>
      <Button variant="primary" onClick={saveOaObj}>
        Save Changes
      </Button>
    </Modal.Footer>
  </Modal>
 </div>
}

export default OaInput;
