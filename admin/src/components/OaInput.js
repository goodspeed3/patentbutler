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

  }
  const rejectionListElements = () => (
    rejectionList.map(rejection => (
      <div />
    ))
    )

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
    console.log(applicationNumber)
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
