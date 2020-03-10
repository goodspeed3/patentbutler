import React, {useState, useEffect} from 'react';
import './process.css'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'

import Button from 'react-bootstrap/Button'
function OaInput (props) {
  let { fileData, oaObject, setOaObject, saveOaObject } = props
  const [rejectionList, setRejectionList] = useState([])
  const [applicationNumber, setApplicationNumber] = useState('')
  const [attyDocket, setAttyDocket] = useState('')
  const [mailingDate, setMailingDate] = useState('')
  const [filingDate, setFilingDate] = useState('')


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
          <Form.Label>Rejection Type</Form.Label>
          <Form.Control as="select" onChange={(e) => setRejType(index, e.target.value)} value={rejection.type}>
            <option value='exrem'>Ex. Remarks</option>
            <option value='101'>101</option>
            <option value='112'>112</option>
            <option value='102'>102</option>
            <option value='103'>103</option>
            <option value='other'>Other</option>

          </Form.Control>
        </Form.Group>
        <Form.Group md={3} as={Col}>
          <Button variant="warning" onClick={() => removeRejection(index)}>x</Button>
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
  const addClaimArgument = (rejectionIndex) => {
    let rejection = rejectionList[rejectionIndex]
    rejection.claimArgumentList.push({
      number: 0, //elements where number is 0 will not be saved to server
      snippetList: []
    })
    //needs a new object to trigger update of array
    setRejectionList(JSON.parse(JSON.stringify(rejectionList)))
  }
  const changeClaimArg = (rejectionIndex, claimArgIndex, value) => {
    let rejection = rejectionList[rejectionIndex]
    let claimArg = rejection.claimArgumentList[claimArgIndex]
    claimArg.number = value;
    //needs a new object to trigger update of array
    setRejectionList(JSON.parse(JSON.stringify(rejectionList)))
  }


  const claimArgumentListElements = (rejectionIndex) => {
    let rejection = rejectionList[rejectionIndex]
    if (rejection.claimArgumentList.length == 0) {
      addClaimArgument(rejectionIndex)
    }
    return rejection.claimArgumentList.map((claimRejection, index) => {
      // onChange={(e) => setBlurb(index, e.target.value)} value={rejection.blurb}
      return (<div key={"claimRej"+index}>
        <Form.Row  >
        <Form.Group md={2} as={Col} controlId={"formGridClaimArg"+index}>
          <Form.Label>Claim</Form.Label>
          <Form.Control name={"claim"+index} type="text" value={claimRejection.number} onChange={(e) => changeClaimArg(rejectionIndex, index, e.target.value)} />
        </Form.Group>
        <Form.Group as={Col} md={5} controlId={"formGridClaimSnippet"+index}>
          <Form.Label>Claim Snippet</Form.Label>
          <Form.Control as="textarea" rows="2" />
        </Form.Group>
        <Form.Group md={4} as={Col} controlId={"formGridExRemSnippet"+index}>
          <Form.Label>Examiner Remarks</Form.Label>
          <Form.Control as="textarea" rows="2" />
        </Form.Group>
        <Form.Group md={1} as={Col}>
          <Button variant="outline-success" hidden={index !== rejection.claimArgumentList.length - 1 ? true : false} onClick={() => addClaimArgument(rejectionIndex)}>+</Button>
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
    console.log("submitting")
    e.preventDefault()
    e.stopPropagation();
  }


    return <div className='formSubmission'>
  <Form onSubmit={handleSubmit}>
  <Form.Row>
  <Form.Group as={Col} controlId="formGridAppNo">
      <Form.Label>Application No</Form.Label>
      <Form.Control name="applicationNumber" type="text" placeholder="xx/yyy,yyy" value={applicationNumber} onChange={handleChange} />
    </Form.Group>
    <Form.Group as={Col} controlId="formGridAttyDocket">
      <Form.Label>Attorney Docket</Form.Label>
      <Form.Control name="attyDocket" value={attyDocket} type="text" placeholder="Enter docket"  onChange={handleChange} />
    </Form.Group>
  </Form.Row>

  <Form.Row>
  <Form.Group as={Col} controlId="formGridMailDate">
      <Form.Label>Mail Date</Form.Label>
      <Form.Control name="mailingDate" type="text" value={mailingDate} placeholder="MM/DD/YYYY"  onChange={handleChange} />
    </Form.Group>
    <Form.Group as={Col} controlId="formGridFileDate">
      <Form.Label>Filing Date</Form.Label>
      <Form.Control name="filingDate" type="text" value={filingDate} placeholder="MM/DD/YYYY"  onChange={handleChange} />
    </Form.Group>
  </Form.Row>
  {rejectionListElements()}
  <Button variant="info" onClick={addRejection}>
    Add Rejection
  </Button>
  <Button className='submitButton' variant="primary" type="submit">
    Submit
  </Button>

  {/* <Form.Group controlId="formGridAddress1">
    <Form.Label>Address</Form.Label>
    <Form.Control placeholder="1234 Main St" />
  </Form.Group>

  <Form.Group controlId="formGridAddress2">
    <Form.Label>Address 2</Form.Label>
    <Form.Control placeholder="Apartment, studio, or floor" />
  </Form.Group>

  <Form.Row>
    <Form.Group as={Col} controlId="formGridCity">
      <Form.Label>City</Form.Label>
      <Form.Control />
    </Form.Group>

    <Form.Group as={Col} controlId="formGridState">
      <Form.Label>State</Form.Label>
      <Form.Control as="select">
        <option>Choose...</option>
        <option>...</option>
      </Form.Control>
    </Form.Group>

    <Form.Group as={Col} controlId="formGridZip">
      <Form.Label>Zip</Form.Label>
      <Form.Control />
    </Form.Group>
  </Form.Row>

  <Form.Group id="formGridCheckbox">
    <Form.Check type="checkbox" label="Check me out" />
  </Form.Group> */}

</Form>   
 </div>
}

export default OaInput;
