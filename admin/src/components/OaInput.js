import React, {useState, useEffect} from 'react';
import './process.css'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
function OaInput (props) {
  let { fileData, oaObject, setOaObject, saveOaObject } = props
  const [rejectionList, setRejectionList] = useState([])
  const [applicationNumber, setApplicationNumber] = useState('')
  const [attyDocket, setAttyDocket] = useState('')
  const [mailingDate, setMailingDate] = useState('')
  const [filingDate, setFilingDate] = useState('')
  const [show, setShow] = useState(false);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);


  const addRejection = () => {
    const newRejection = {
      type: 'unknown' + rejectionList.length,
      typeText: '',
      priorArtList: [],
      claimArgumentList: [],
      blurb: ''
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
    setRejectionList([...rejectionList])
  }
  const setBlurb = (index, value) => {
    rejectionList[index].blurb = value
    setRejectionList([...rejectionList])
  }


  const rejectionListElements = () => {
    return rejectionList.map((rejection, index) => {
      let elements = (
        <div key={"rej"+index}>
        <Form.Row  >
        <Form.Group as={Col} md={9} controlId={"formGridRejType"+index}>
          <Form.Label><b>Rejection Type</b></Form.Label>
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
          <Button size='sm' variant="warning" onClick={() => removeRejection(index)}>x</Button>
        </Form.Group>
        </Form.Row>
        { rejection.type !== '102' && rejection.type !== '103' ? 
        <Form.Group controlId={"formGridBlurb" + index}>
          <Form.Label>Blurb</Form.Label>
          <Form.Control as="textarea" rows="3" onChange={(e) => setBlurb(index, e.target.value)} value={rejection.blurb} />
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
      citationList: []
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
      return (<div key={"claimRej"+index}>
        <Form.Row  >
        <Form.Group md={1} as={Col} controlId={"formGridClaimArg"+index}>
          <Form.Label>Claim</Form.Label>
          <Form.Control size='sm' name={"claim"+index} type="text" value={claimRejection.number} onChange={(e) => changeClaimArg(rejectionIndex, index, e.target.value, 'number')} />
        </Form.Group>
        <Form.Group as={Col} md={5} controlId={"formGridClaimSnippet"+index}>
          <Form.Label>Claim Snippet</Form.Label>
          <Form.Control size='sm' as="textarea" rows="2" value={claimRejection.snippetText} onChange={(e) => changeClaimArg(rejectionIndex, index, e.target.value, 'snippetText')} />
        </Form.Group>
        <Form.Group md={4} as={Col} controlId={"formGridExRemSnippet"+index}>
          <Form.Label>Examiner Remarks</Form.Label>
          <Form.Control size='sm' as="textarea" rows="2"  value={claimRejection.examinerText} onChange={(e) => changeClaimArg(rejectionIndex, index, e.target.value, 'examinerText')} />
        </Form.Group>
        <Form.Group md={2} as={Col}>
          <Button size='sm' variant={index !== rejection.claimArgumentList.length - 1 ? "outline-danger" : "outline-success"} onClick={index !== rejection.claimArgumentList.length - 1 ? () => removeClaimArgument(rejectionIndex, index) : () => addClaimArgument(rejectionIndex)}>{index !== rejection.claimArgumentList.length - 1 ? '-Snip' : '+Snip'}</Button>
        </Form.Group>
        </Form.Row>
        {citationListElements(rejectionIndex, index)}
                
      </div>)
    })
  }
  const addCitation = (rejectionIndex, claimArgIndex) => {
    let rejection = rejectionList[rejectionIndex]
    rejection.claimArgumentList[claimArgIndex].citationList.push({
      citation: '',  //empty citations will be ignored by server
      publicationNumber: ''
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
    let ciationObj = rejection.claimArgumentList[claimArgIndex].citationList[citationIndex]
    ciationObj[field] = value;
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
      return (<div key={"cit"+claimArgIndex+index}>
        <Form.Row  >
        <Form.Group as={Col} controlId={"formGridCitation"+claimArgIndex+index}>
          <Form.Label>Citation</Form.Label>
          <Form.Control size='sm' md={6} type="text" placeholder="citation should match text in ex remark" value={citation.citation} onChange={(e) => changeCitation(rejectionIndex, claimArgIndex, index, e.target.value, 'citation')} />
        </Form.Group>
        <Form.Group md={4} as={Col} controlId={"formGridPubNum"+claimArgIndex+index}>
          <Form.Label>Publication Number</Form.Label>
          <Form.Control size='sm' type="text"  value={citation.publicationNumber} onChange={(e) => changeCitation(rejectionIndex, claimArgIndex, index, e.target.value, 'publicationNumber')} />
        </Form.Group>
        <Form.Group md={2} as={Col}>
          <Button size='sm' variant={index !== rejection.claimArgumentList[claimArgIndex].citationList.length - 1 ? "outline-danger" : "outline-success"} onClick={index !== rejection.claimArgumentList[claimArgIndex].citationList.length - 1 ? () => removeCitation(rejectionIndex, claimArgIndex, index) : () => addCitation(rejectionIndex, claimArgIndex)}>{index !== rejection.claimArgumentList[claimArgIndex].citationList.length - 1 ? '-Cit' : '+Cit'}</Button>
        </Form.Group>
        </Form.Row>
                
      </div>)
    })
  }  

  const handleChange = (e) => {
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
      default: 
        console.log('should not reach')
    }
  }
  const handleSubmit = (e) => {
    setShow(true)
    e.preventDefault()
    e.stopPropagation();
  }

  const finalizeRejectionList = () => {
    return JSON.stringify(rejectionList, null, 2)
  }
    return <div className='formSubmission'>
  <Form onSubmit={handleSubmit}>
  <Form.Row>
  <Form.Group as={Col} controlId="formGridAppNo">
      <Form.Label>Application No</Form.Label>
      <Form.Control size='sm' name="applicationNumber" type="text" placeholder="xx/yyy,yyy" value={applicationNumber} onChange={handleChange} />
    </Form.Group>
    <Form.Group as={Col} controlId="formGridAttyDocket">
      <Form.Label>Attorney Docket</Form.Label>
      <Form.Control size='sm' name="attyDocket" value={attyDocket} type="text" placeholder="Enter docket"  onChange={handleChange} />
    </Form.Group>
  </Form.Row>

  <Form.Row>
  <Form.Group as={Col} controlId="formGridMailDate">
      <Form.Label>Mail Date</Form.Label>
      <Form.Control size='sm' name="mailingDate" type="text" value={mailingDate} placeholder="MM/DD/YYYY"  onChange={handleChange} />
    </Form.Group>
    <Form.Group as={Col} controlId="formGridFileDate">
      <Form.Label>Filing Date</Form.Label>
      <Form.Control size='sm' name="filingDate" type="text" value={filingDate} placeholder="MM/DD/YYYY"  onChange={handleChange} />
    </Form.Group>
  </Form.Row>
  {rejectionListElements()}
  <Button variant="info" onClick={addRejection}>
    Add Rejection
  </Button>
  <Button className='submitButton' variant="primary" type="submit">
    Submit
  </Button>
</Form>
  <Modal show={show} onHide={handleClose}>
    <Modal.Header closeButton>
      <Modal.Title>Double-check</Modal.Title>
    </Modal.Header>
    <Modal.Body><pre>{finalizeRejectionList()}</pre></Modal.Body>
    <Modal.Footer>
      <Button variant="secondary" onClick={handleClose}>
        Close
      </Button>
      <Button variant="primary" onClick={handleClose}>
        Save Changes
      </Button>
    </Modal.Footer>
  </Modal>

 </div>
}

export default OaInput;
