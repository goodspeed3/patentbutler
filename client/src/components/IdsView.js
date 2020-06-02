import React, { useState, useEffect } from 'react';
import './IdsView.css'
import Table from 'react-bootstrap/Table'
import { HashLink as Link } from 'react-router-hash-link';
import Spinner from 'react-bootstrap/Spinner'
import Alert from 'react-bootstrap/Alert'
import Button from 'react-bootstrap/Button'
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";

function IdsView() {
  const { getTokenSilently, user } = useAuth0();
  const [idsData, setIdsData] = useState(null)
  const [pbUser, setPbUser] = useState({})
  const [showCreateMatter, setShowCreateMatter] = useState(false)
  const [newAttyDocket, setNewAttyDocket] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    triggerListRefresh();
  }, [user]);

  function triggerListRefresh() {
    if (!user) {
      // no user ye
      return
    }
    var formData = new FormData();
    formData.append('userEmail', user.email);
   
    AuthApi('/api/home/ids', getTokenSilently, formData)
    .then(res => {
      setIdsData(res)
      setPbUser(res.user)
    })  
  }
  function createMatter() {
    var formData = new FormData();
    formData.append('userFirm', pbUser.firm);
    formData.append('userEmail', user.email);
    formData.append('attyDocket', newAttyDocket);

    AuthApi('/api/home/ids/create', getTokenSilently, formData)
    .then(res => {
      if (res.error) {
        setErrorMsg(res.error)
      } else {
        setErrorMsg('')
        setIdsData(res)
        setShowCreateMatter(false)
      }
    })  

  }
  function showIds() {
    if (idsData.list && idsData.list[0].length === 0 ) {
      return ;
    }
    //first element is the list, second element is cursor data
    return <Table className='idsTable' striped bordered hover>
      <thead>
        <tr>
          <th>Attorney Docket</th>
          <th>Cited</th>
          <th>Should Cite</th>
          <th>Options</th>
        </tr>
      </thead>
      <tbody>
        {idsData.list[0].map( idsEntity => {
          return (
              <tr key={idsEntity.attyDocket} >
                <td><Link to={"/ids/view/" + encodeURIComponent(idsEntity.attyDocket)}>{idsEntity.attyDocket}</Link></td>
                <td>00</td>
                <td>00</td>
                <td>Rename | Delete</td>
              </tr>
          )
        })}        
      </tbody>      
    </Table>
  }


  let elementsToShow;
  if (!user || !idsData) {
    elementsToShow = <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div>
  } else {
    elementsToShow = <div className='idsList'>
    <div className='idsColumn'>
    <Button variant="success" onClick={() => setShowCreateMatter(true)}>Create Attorney Docket ID</Button>

      {/* <div className='columnHeader'>Attorney Docket</div> */}
      {showIds()}
    </div>
  </div>
  }

  return (
    <div>
        
        {elementsToShow}
        <Modal show={showCreateMatter} onHide={() => setShowCreateMatter(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Create New Attorney Docket ID</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {errorMsg!=='' && 
        <Alert variant='danger'>
            {errorMsg}
        </Alert>          
          }
        <Form>
          <Form.Group >
            <Form.Label>New Attorney Docket</Form.Label>
            <Form.Control value={newAttyDocket} type="text" placeholder="Enter new Attorney Docket, e.g., 12345-0000US01" onChange={(e) => setNewAttyDocket(e.target.value)} />
          </Form.Group>
        </Form>          
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => createMatter()}>
            Create
          </Button>
        </Modal.Footer>
      </Modal>

    </div>
  )



}

export default IdsView;
