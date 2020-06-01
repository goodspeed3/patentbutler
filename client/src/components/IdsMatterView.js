import React, { useState, useEffect } from 'react';
import './IdsMatterView.css'
import { useParams } from 'react-router-dom';

import Table from 'react-bootstrap/Table'
// import { HashLink as Link } from 'react-router-hash-link';
import Spinner from 'react-bootstrap/Spinner'
import Alert from 'react-bootstrap/Alert'
import Container from 'react-bootstrap/Container'
import Col from 'react-bootstrap/Col'
import Row from 'react-bootstrap/Row'
import Button from 'react-bootstrap/Button'
// import Modal from 'react-bootstrap/Modal'
// import Form from 'react-bootstrap/Form'
import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";
import Card from 'react-bootstrap/Card'

function IdsMatterView() {
  const { getTokenSilently, user } = useAuth0();
  const [idsMatterData, setIdsMatterData] = useState(null)
  // const [pbUser, setPbUser] = useState({})
  const [matterSaved, setMatterSaved] = useState(true)
  let { attyDocket } = useParams();
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!user) {
      // no user yet
      return
    }
    var formData = new FormData();
    formData.append('userEmail', user.email);
    formData.append('attyDocket', decodeURIComponent(attyDocket));


    AuthApi('/api/idsMatter', getTokenSilently, formData)
    .then(res => {
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setErrorMsg('')
        // setPbUser(res.user)
        console.log(res)
        if (!res.attyDocket.metadata) {
          res.attyDocket.metadata = {
          }
        }
        setIdsMatterData(res.attyDocket)
      }

    })  
  }, [user]);
  useEffect(() => {
    if (!idsMatterData) return
    setMatterSaved(false)
    const timer = setTimeout(() => {
      //save to server
      var formData = new FormData();
      formData.append('userEmail', user.email);
      formData.append('idsMatterData', JSON.stringify(idsMatterData));
    
      AuthApi('/api/updateIdsMatter', getTokenSilently, formData)
      .then(res => {
        setMatterSaved(true)
      })  
    }, 2000); //every 2 sec
    return () => clearTimeout(timer);
  }, [idsMatterData]);


  function updateMetadata(e) {
    const t = e.target
    switch(t.name) {
      case 'applicationNumber': 
        idsMatterData.metadata.applicationNumber = t.value
        break;
      case 'filingDate':
        idsMatterData.metadata.filingDate = t.value
        break;
      case 'inventor':
        idsMatterData.metadata.inventor = t.value
        break;
      case 'artUnit':
        idsMatterData.metadata.artUnit = t.value
        break;
      case 'examiner':
        idsMatterData.metadata.examiner = t.value
        break;
      default: 
        console.log('should not reach')
    }    
    setIdsMatterData(JSON.parse(JSON.stringify(idsMatterData)))

  }
  function metadataElements() {

    return <Table bordered striped hover size="sm" >
    <thead>
      <tr>
        <th style={{width: "30%"}}>Attorney Docket</th>
        <th>{idsMatterData.attyDocket} {matterSaved && <small className='text-muted'>saved</small>}</th>
      </tr>
    </thead>
    <tbody className="metadataTable">
      {
        (!idsMatterData.metadata.applicationNumber || !idsMatterData.metadata.filingDate || !idsMatterData.metadata.inventor || !idsMatterData.metadata.artUnit || !idsMatterData.metadata.examiner) && <tr>
          <td colSpan="2" style={{textAlign: "center"}}><Button variant="outline-info">Autofill using filed IDS</Button></td>
        </tr>
      }
      <tr>
        <td>Application Number</td>
        <td><input type="text" name="applicationNumber" value={(idsMatterData.metadata.applicationNumber) ? idsMatterData.metadata.applicationNumber : ""} placeholder="12/345678" onChange={updateMetadata} /></td>
      </tr>
      <tr>
        <td>Filing Date</td>
        <td><input type="text" name="filingDate" value={(idsMatterData.metadata.filingDate) ? idsMatterData.metadata.filingDate : ""} placeholder={new Date().toLocaleDateString()} onChange={updateMetadata} /></td>
      </tr>
      <tr>
        <td>Inventor</td>
        <td ><input type="text" name="inventor" value={(idsMatterData.metadata.inventor) ? idsMatterData.metadata.inventor : ""} placeholder="Smith" onChange={updateMetadata} /></td>
      </tr>
      <tr>
        <td>Art Unit</td>
        <td><input type="text" name="artUnit" value={(idsMatterData.metadata.artUnit) ? idsMatterData.metadata.artUnit : ""} placeholder="3600" onChange={updateMetadata} /></td>
      </tr>
      <tr>
        <td>Examiner Name</td>
        <td><input type="text" name="examiner" value={(idsMatterData.metadata.examiner) ? idsMatterData.metadata.examiner : ""} placeholder="Washington" onChange={updateMetadata} /></td>
      </tr>
    </tbody>
  </Table>
  }

  function citeListElements() {
    return <>
      <Button variant="secondary">Import 892, ISR, or IDS</Button>
      
    </>

  }

  function buttonElements() {
    return <div className='buttonElements'>
      <Button variant="success">Generate SB08</Button>
    </div>
  }

  function idsSyncElements() {
    return   <Card>
    <Card.Header as="h5">IDS Sync</Card.Header>
    <Card.Body>
      {/* <Card.Title>Info Card Title</Card.Title> */}
      <Card.Text>
        Some quick example text to build on the card title and make up the bulk
        of the card's content.
      </Card.Text>
    </Card.Body>
  </Card>

  }
  var elements = <></>;
  if (errorMsg !== '') {
    elements = <Alert variant='danger'>
        {errorMsg}  Go <a href="/ids">back</a>.
    </Alert> 
  } else if (!user || !idsMatterData) {
    elements = <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div>
  } else {
    elements = 
      <Container className="idsMatterBlock">
        <Row>
        <Col md="8">
            {metadataElements()}
            {citeListElements()}
        </Col>
        <Col>
          {buttonElements()}
          {idsSyncElements()}
        </Col>
        </Row>
      </Container>    
  }
  return (
    <div>
      {elements}
    </div>
  )



}

export default IdsMatterView;
