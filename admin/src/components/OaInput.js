import React, {useState, useEffect} from 'react';
import './process.css'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'
import { nanoid } from 'nanoid'
const reactStringReplace = require('react-string-replace');


function OaInput (props) {
  let { fileData, saveOaToCloud, setShowPriorArt, savePaToCloud, priorArtList, setPriorArtList, rejectionList, setRejectionList } = props
  let { filename, user:email, originalname} = fileData
  const [applicationNumber, setApplicationNumber] = useState('')
  const [attyDocket, setAttyDocket] = useState('')
  const [mailingDate, setMailingDate] = useState('')
  const [filingDate, setFilingDate] = useState('')
  const [forDemo, setForDemo] = useState(false)
  const [show, setShow] = useState(false);
  const [validated, setValidated] = useState(false);
  const [showLoading, setShowLoading] = useState(false);
  const imgRef = React.useRef()


  // useTraceUpdate(props);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);
  // function useTraceUpdate(props) {
  //   const prev = useRef(props);
  //   useEffect(() => {
  //     const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
  //       if (prev.current[k] !== v) {
  //         ps[k] = [prev.current[k], v];
  //       }
  //       return ps;
  //     }, {});
  //     if (Object.keys(changedProps).length > 0) {
  //       console.log('Changed props:', changedProps);
  //     }
  //     prev.current = props;
  //   });
  // }
  
  useEffect(() => {
    if (fileData && (fileData.computerProcessingTime || fileData.finishedProcessingTime)) { //prefill the page with what was processed
      setApplicationNumber(fileData.applicationNumber)
      setAttyDocket(fileData.attyDocket)
      setMailingDate(fileData.mailingDate)
      setFilingDate(fileData.filingDate)
      setRejectionList(fileData.rejectionList)
      setPriorArtList(fileData.priorArtList)
      setForDemo(fileData.forDemo)
    }
  }, [fileData, setPriorArtList, setRejectionList])

  const addRejection = (index = -1) => {
    const newRejection = {
      type: 'otherRej', //it's the first default rejection
      typeText: '',
      claimArgumentList: [],
      blurb: '',
      id: nanoid()
    }
    if (index === -1) {
      rejectionList.push(newRejection)
    } else {
      rejectionList.splice(index, 0, newRejection)
    }
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
      case '101':
        rejectionList[index].typeText = '§ 101 Rejection'
        break;
      case '112':
        rejectionList[index].typeText = '§ 112 Rejection'
        break;
      case '102':
        rejectionList[index].typeText = '§ 102 Rejection'
        if (rejectionList[index].claimArgumentList.length === 0) {
          addClaimArgument(index)
        }    
        break;
      case '103':
        rejectionList[index].typeText = '§ 103 Rejection'
        if (rejectionList[index].claimArgumentList.length === 0) {
          addClaimArgument(index)
        }    
        break;
      case 'otherRej':
        rejectionList[index].typeText = ''
        break;
      default:
        console.log('error rej type')
    }    
    setRejectionList([...rejectionList])
  }
  const changeTypeText = (index, value) => {
    rejectionList[index].typeText = value
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
          <Form.Group as={Col} md={1}><Form.Label><b>Header:</b></Form.Label></Form.Group>
        <Form.Group as={Col} md={2}>
        <Form.Control size='sm' as="select" onChange={(e) => setRejType(index, e.target.value)} value={rejection.type}>
        <option value='otherRej'>Other</option>
            <option value='101'>101</option>
            <option value='112'>112</option>
            <option value='102'>102</option>
            <option value='103'>103</option>
          </Form.Control>
        </Form.Group>
        {rejection.type === 'otherRej' && <Form.Group md={4} as={Col}><Form.Control required size='sm' type="text" placeholder="Enter header" value={rejection.typeText} onChange={(e) => changeTypeText(index, e.target.value)} /></Form.Group>}
        <Form.Group md={2} as={Col}>
          <Button size='sm' variant="warning" onClick={() => removeRejection(index)}>Remove</Button>
          &nbsp; <Button size='sm' variant="info" onClick={() => addRejection(index)}>^Rej</Button>
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
  
  const addClaimArgument = (rejectionIndex, claimArgIndex = -1, addCitToNext = false) => {
    let rejection = rejectionList[rejectionIndex]
    var number = ''
    if (claimArgIndex > 0) {
      number = rejectionList[rejectionIndex].claimArgumentList[claimArgIndex].number
    }
    rejection.claimArgumentList.splice(claimArgIndex+1, 0, {
      number: number, //elements where number is '' will not be saved to server
      snippetText: '', //onsubmit, will convert all snippets into snippetList, kept in this form for now due to ease of removal / addition
      examinerText: '',
      citationList: [],
      id: nanoid()
    })
    // addCitation(rejectionIndex, (addCitToNext ? claimArgIndex + 1 : claimArgIndex)) //has to be no citations      

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
  const toggleExRemField = (rejectionIndex, claimArgIndex) => {
    let rejection = rejectionList[rejectionIndex]
    let claimArg = rejection.claimArgumentList[claimArgIndex]
    if (!claimArg.showEdit) {
      claimArg.showEdit = true
    } else {
      claimArg.showEdit = false
    }
    setRejectionList(JSON.parse(JSON.stringify(rejectionList)))

  }
  const getBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }
  
  const insertImg = async (rejectionIndex, claimArgIndex, e) => {
    let rejection = rejectionList[rejectionIndex]
    let claimArg = rejection.claimArgumentList[claimArgIndex]

    let maxSize = 1040000
    let img = imgRef.current.files[0]
    if (img.size > maxSize) {
      claimArg.examinerText = `Size: ${img.size} -- too big`
    } else {
      claimArg.examinerBlob = await getBase64(img)
      claimArg.showEdit = false
    }
    setRejectionList(JSON.parse(JSON.stringify(rejectionList)))

  }
  const highlightText = (claimRejection) => {
    var regMappedCitations = [];
    //need to sort by length descending so longest ones get linkified first which won't prevent shorter ones later prevent longer ones from getting linked
    let copyCitationList = JSON.parse(JSON.stringify(claimRejection.citationList))
    copyCitationList.sort((a, b) => {
      return (a.citation.length < b.citation.length) ? 1 : -1
    })

    for (var i = 0; i < copyCitationList.length; i++) {
      var citationObj = copyCitationList[i];
      var escapedRegExp = citationObj.citation.replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        '\\$&'
      );
      regMappedCitations.push(escapedRegExp);
    }

    var re = new RegExp('(' + regMappedCitations.join('|') + ')', 'g');
    var highlightedText = reactStringReplace(
      claimRejection.examinerText,
      re,
      (match, i) => (
        <span style={{color: "green", textDecoration: "underline"}}
          key={'l'+ i}
        >
          {match}
        </span>
      )
    );

    return highlightedText
  }

  const claimArgumentListElements = (rejectionIndex) => {
    // debugger
    let rejection = rejectionList[rejectionIndex]
    // if (rejection.claimArgumentList.length === 0) {
    //   addClaimArgument(rejectionIndex)
    // }

    return rejection.claimArgumentList.map((claimRejection, index) => {

      return (<div key={claimRejection.id}>
        <Form.Row  >
        <Form.Group md={2} as={Col} >
          <Form.Label><u>Claim</u></Form.Label>
          <Form.Control required size='sm' name={"claim"+index} as="textarea" rows="5" value={claimRejection.number} onChange={(e) => changeClaimArg(rejectionIndex, index, e.target.value, 'number')} />
        </Form.Group>
        <Form.Group as={Col} md={3} >
          <Form.Label><u>Claim Snippet</u></Form.Label>
          <Form.Control size='sm' as="textarea" rows="5" value={claimRejection.snippetText} onChange={(e) => changeClaimArg(rejectionIndex, index, e.target.value, 'snippetText')} />
        </Form.Group>
        <Form.Group md={7} as={Col} >
          <Form.Label><u>Examiner Remarks</u>
          {rejection.claimArgumentList.length !==1 && 
          <Button style={{marginRight: "0.1rem", marginLeft: "0.1rem"}} size='sm' variant="outline-danger" onClick={() => removeClaimArgument(rejectionIndex, index)}>-Snip</Button>
          }
          <Button style={{marginRight: "0.1rem"}} size='sm' variant="outline-warning" onClick={() => addClaimArgument(rejectionIndex, index-1)}>^Snip</Button>
          <Button style={{marginRight: "0.3rem"}} size='sm' variant={"outline-success"} onClick={() => addClaimArgument(rejectionIndex, index, true)}>+Snip</Button>
            <Button size='sm' variant="outline-success" onClick={() => addCitation(rejectionIndex, index, -1, '')}>+Cit</Button>
            <Button size='sm' style={{marginLeft: "0.3rem"}} variant="outline-info" onClick={() => toggleExRemField(rejectionIndex, index)}>Toggle Edit</Button>
          </Form.Label>
          {
            (claimRejection.showEdit) ? 
            <>
              <input type="file" ref={imgRef} onChange={e => insertImg(rejectionIndex, index, e)} />
                {(claimRejection.examinerBlob) ? <div className='examRemText'>Size: ~{claimRejection.examinerBlob.length * 3.0 / 4.0} bytes - {claimRejection.examinerBlob.substring(0,20)}... </div> : <Form.Control required size='sm' as="textarea" rows="5"  value={claimRejection.examinerText} onChange={(e) => changeClaimArg(rejectionIndex, index, e.target.value, 'examinerText')} />}
            </>
            :
            (claimRejection.examinerBlob) ? <img src={claimRejection.examinerBlob} alt='oa' />: <div className='examRemText'>{highlightText(claimRejection)}</div>
          }
        </Form.Group>
        {/* <Form.Group md={2} as={Col}>
        </Form.Group> */}
        </Form.Row>
        {citationListElements(rejectionIndex, index)}
                
      </div>)
    })
  }
  const addCitation = (rejectionIndex, claimArgIndex, index, prevAbbrev = '') => {
    let rejection = rejectionList[rejectionIndex]
    rejection.claimArgumentList[claimArgIndex].citationList.splice(index+1, 0, {
      citation: '',  //empty citations will be ignored by server
      abbreviation: prevAbbrev,
      id: nanoid()
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
    citationObj[field] = value;

    //needs a new object to trigger update of array
    setRejectionList(JSON.parse(JSON.stringify(rejectionList)))

  }
  const citationInExamRemark = (rejectionIndex, claimArgIndex, citationIndex) => {
    let citationText = rejectionList[rejectionIndex].claimArgumentList[claimArgIndex].citationList[citationIndex]['citation']
    if (rejectionList[rejectionIndex].claimArgumentList[claimArgIndex].examinerText.includes(citationText)) {
      return <span role='img' aria-label='y'>&#9989;</span> //green check
    } else {
      return <span role='img' aria-label='x'>&#10060;</span> //red x
    }
  }
  const citationAbbrevInPA = (rejectionIndex, claimArgIndex, citationIndex) => {
    let abbreviation = rejectionList[rejectionIndex].claimArgumentList[claimArgIndex].citationList[citationIndex]['abbreviation']
    var isInPa = false;
    for (let pa of priorArtList) {
      if (pa.abbreviation === abbreviation) {
        isInPa = true
      }
    }
    if (isInPa) {
      return <span role='img' aria-label='y'>&#9989;</span> //green check
    } else {
      return <span role='img' aria-label='x'>&#10060;</span> //red x
    }
  }
  const citationListElements = (rejectionIndex, claimArgIndex) => {
    let rejection = rejectionList[rejectionIndex]
    return rejection.claimArgumentList[claimArgIndex].citationList.map((citation, index) => {
      // onChange={(e) => setBlurb(index, e.target.value)} value={rejection.blurb}
      return (<div key={citation.id}>
        <Form.Row  >
        <Form.Group as={Col} md={2} >
        </Form.Group>
        <Form.Group as={Col} md={3} >
        <Form.Label>Citation { citationInExamRemark(rejectionIndex, claimArgIndex, index)}</Form.Label>
          <Form.Control size='sm' type="text" placeholder="citation should match ex remarks" value={citation.citation} onChange={(e) => changeCitation(rejectionIndex, claimArgIndex, index, e.target.value, 'citation')} />
        </Form.Group>
        <Form.Group md={5} as={Col} >
          <Form.Label>Abbreviation { citationAbbrevInPA(rejectionIndex, claimArgIndex, index)}</Form.Label>
          <Form.Control size='sm' type="text" value={citation.abbreviation} onChange={(e) => changeCitation(rejectionIndex, claimArgIndex, index, e.target.value, 'abbreviation')} />
        </Form.Group>
        <Form.Group md={2} as={Col}>
          <Button style={{marginRight: "0.1rem"}} size='sm' variant="outline-danger" onClick={() => removeCitation(rejectionIndex, claimArgIndex, index)}>-Cit</Button>
          <Button size='sm' variant="outline-success" onClick={() => addCitation(rejectionIndex, claimArgIndex, index, citation.abbreviation)}>+Cit</Button>
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
        priorArtList[index][property] = t.value
        if (property === 'abbreviation') {
          for (var i=0; i<rejectionList.length; i++) {
            for (var j=0; j<rejectionList[i].claimArgumentList.length; j++) {
              for (var k=0; k<rejectionList[i].claimArgumentList[j].citationList.length; k++) {
                const citation = rejectionList[i].claimArgumentList[j].citationList[k]
                if (priorArtList.every((pa) => citation.abbreviation !== pa.abbreviation)) {
                  citation.abbreviation = t.value
                }
              }
            }
          }
          setRejectionList(JSON.parse(JSON.stringify(rejectionList)))
        }
        setPriorArtList(JSON.parse(JSON.stringify(priorArtList)))
        break;
      default: 
        console.log('should not reach')
    }
  }
  const handleSubmit = (e) => {
    const form = e.currentTarget;
    if (form.checkValidity() === false) { 
      e.preventDefault();
      e.stopPropagation();
      return
    }


    setValidated(true);

    handleShow()
    e.preventDefault()
    e.stopPropagation();
  }

  const finalizeRejectionList = () => {
    return "Are you sure you want to proceed?"
  }

  const saveOaObj = (sendEmail) => {
    //if not all citations have overlays...
    if (priorArtList) {
      var allOverlaysAdded = true
      var citationOverlayNeeded = ''
      priorArtList.forEach((pa) => {
        pa.citationList.forEach((citation) => {
          if (citation.boundingBoxes.length === 0) {
            allOverlaysAdded = false
            citationOverlayNeeded = `${citation.abbreviation}: ${citation.citation}`
          }
        })
      })
      if (!allOverlaysAdded ) {
        allOverlaysAdded = false
        alert(citationOverlayNeeded + ' overlay still needed before notifying!')
      }
      if (!allOverlaysAdded && document.activeElement.innerText !== 'Save')
        return //don't save if you click notify and not all overlays are there
    }

    let finalizedOaObject = {
      computerProcessingTime: (fileData && fileData.computerProcessingTime) || Date.now(),
      textAnnotations: (fileData && fileData.textAnnotations) || {},
      finishedProcessingTime: Date.now(),
      filename: filename,
      originalname: originalname,
      user: email,
      mailingDate: mailingDate,
      filingDate: filingDate,
      applicationNumber: applicationNumber,
      attyDocket: attyDocket,
      rejectionList: rejectionList,
      priorArtList: priorArtList,
      forDemo: forDemo
    }
    saveOaToCloud(finalizedOaObject, sendEmail)
    
    handleClose()
  }

  const handlePaUpload = async (e, index) => {
    var formData = new FormData();
    var oaFile = e.target.files[0];
    formData.append('file', oaFile);
    formData.append('userEmail', email);
    setShowLoading(true)
    let res = await savePaToCloud(formData)
    setShowLoading(false)
    
    //set the  cloudUrl to the right priorArtList variable and save it
    var priorArt = priorArtList[index]
    priorArt = {...priorArt, ...res.paObjects}
    priorArtList[index] = priorArt
    setPriorArtList([...priorArtList])
    setShowPriorArt(true)
    setRejectionList([...rejectionList])
    //force rejectionList to update by making another copy
    
  }
  const addCitedArt = () => {
    const newCitedArt = {
      "title": '',
      "publicationNumber": '',
      "abbreviation": '',
      "originalname": '',
      "filename": '',
      "cloudUrl": '',
      "citationList": [],
      "assignee": '',
      "id": nanoid()
    }

    priorArtList.push(newCitedArt)
    //needs ... to trigger update of array
    setPriorArtList([...priorArtList])
  }
  const removeCitedArt = (index) => {
    priorArtList.splice(index, 1)
    //needs ... to trigger update of array
    setPriorArtList([...priorArtList])
  }

  const showPriorArtElements = () => {
    if (priorArtList.length > 0) {
      return <>
      {priorArtList.map((paFile, index) =>
        <div key={paFile.id || paFile.filename}>
          <Form.Row>
          <Form.Label style={{marginTop: '1rem'}}><b>{paFile.originalname || 'None'}</b></Form.Label>
          <Form.Group as={Col}>
          <Button size='sm' variant="warning" onClick={() => removeCitedArt(index)}>Remove</Button>
          </Form.Group>
          </Form.Row>
          <Form.Row>
          <Form.Group as={Col}>
              <Form.Label>Abbreviation</Form.Label>
              <Form.Control required size='sm' name="priorArtObj" placeholder="Marks" value={priorArtList[index].abbreviation} onChange={(e) => handleChange(e, index, 'abbreviation')} />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Publication Number</Form.Label>
              <Form.Control required size='sm' name="priorArtObj" value={priorArtList[index].publicationNumber} type="text" onChange={(e) => handleChange(e, index, 'publicationNumber')} />
            </Form.Group>
            <Form.Group as={Col}>
              <Form.Label>Assignee</Form.Label>
              <Form.Control size='sm' name="priorArtObj" value={priorArtList[index].assignee} type="text" placeholder="Sony Interactive Entertainment, Inc."  onChange={(e) => handleChange(e, index, 'assignee')} />
            </Form.Group>            
          </Form.Row>
          <Form.Row>
            <Form.Label>Title</Form.Label>
            <Form.Control required size='sm' type="text" name="priorArtObj" placeholder="Methods and Apparatus..." value={priorArtList[index].title} onChange={(e) => handleChange(e, index, 'title')} />
          </Form.Row>
          <Form.Row className='paUpload'>
            { priorArtList[index].cloudUrl ? <a href={priorArtList[index].cloudUrl}>{priorArtList[index].originalname}</a> : "Upload Cited Art: "}
            &nbsp;
            <Form.Group >
            <Form.Control
                type="file"
                onChange={(e) => handlePaUpload(e, index)}
                accept=".pdf"
            />
            </Form.Group>
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
      <Form.Control required size='sm' name="applicationNumber" type="text" placeholder="xx/yyy,yyy" value={applicationNumber || ''} onChange={handleChange} />
    </Form.Group>
    <Form.Group as={Col} >
      <Form.Label>Attorney Docket</Form.Label>
      <Form.Control size='sm' name="attyDocket" value={attyDocket || ''} type="text" placeholder="Enter docket"  onChange={handleChange} />
    </Form.Group>
  </Form.Row>

  <Form.Row>
  <Form.Group as={Col} >
      <Form.Label>Mail Date</Form.Label>
      <Form.Control required size='sm' name="mailingDate" type="text" value={mailingDate || ''} placeholder="MM/DD/YYYY"  onChange={handleChange} />
    </Form.Group>
    <Form.Group as={Col} >
      <Form.Label>Filing Date</Form.Label>
      <Form.Control required size='sm' name="filingDate" type="text" value={filingDate || ''} placeholder="MM/DD/YYYY"  onChange={handleChange} />
    </Form.Group>
  </Form.Row>
  {rejectionList && rejectionListElements()}
  <Button variant="info" onClick={(e) => addRejection()}>
    Add Rejection
  </Button>
  <hr />
  {priorArtList && showPriorArtElements()}
  { showLoading ? <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div> : null}
  <Button variant="info" onClick={addCitedArt}>
    Add Cited Art
  </Button><hr />
  <Form.Group> 
  <Form.Check type="checkbox" checked={forDemo || false} onChange={() => setForDemo(!forDemo)}label="For Demo" /></Form.Group>
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
      <Button variant="primary" onClick={() => saveOaObj(false)}>
        Save
      </Button>
      <Button variant="primary" onClick={() => saveOaObj(true)}>
        Save & Notify {email}
      </Button>
    </Modal.Footer>
  </Modal>
 </div>
}

export default OaInput;
