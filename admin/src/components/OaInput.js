import React, {useState, useEffect} from 'react';
import './process.css'
import Form from 'react-bootstrap/Form'
import Col from 'react-bootstrap/Col'

import Button from 'react-bootstrap/Button'
function OaInput (props) {
  let { fileData, oaObject, setOaObject, saveOaObject } = props
  const [rejectionList, setRejectionList] = useState([])


  const addRejection = () => {

  }
  const rejectionListElements = () => (
    rejectionList.map(rejection => (

    ))
    )
  

    return <div className='formSubmission'>
  <Form>
  <Form.Row>
  <Form.Group as={Col} controlId="formGridAppNo">
      <Form.Label>Application No</Form.Label>
      <Form.Control type="text" placeholder="xx/yyy,yyy" />
    </Form.Group>
    <Form.Group as={Col} controlId="formGridAttyDocket">
      <Form.Label>Attorney Docket</Form.Label>
      <Form.Control type="text" placeholder="Enter docket" />
    </Form.Group>
  </Form.Row>

  <Form.Row>
  <Form.Group as={Col} controlId="formGridMailDate">
      <Form.Label>Mail Date</Form.Label>
      <Form.Control type="text" placeholder="MM/DD/YYYY" />
    </Form.Group>
    <Form.Group as={Col} controlId="formGridFileDate">
      <Form.Label>Filing Date</Form.Label>
      <Form.Control type="text" placeholder="MM/DD/YYYY" />
    </Form.Group>
  </Form.Row>
  {rejectionListElements()}
  <Button variant="primary" onClick={addRejection}>
    Add Rejection
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
