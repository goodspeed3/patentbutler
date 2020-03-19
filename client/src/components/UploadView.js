import React, { useState, useEffect } from 'react';
import Jumbotron from 'react-bootstrap/Jumbotron';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal'
import Button from 'react-bootstrap/Button'
import Spinner from 'react-bootstrap/Spinner'

import './UploadView.css'

import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";

function UploadView(props) {
  const [uploadStatus, setUploadStatus] = useState({ uploadedFilename: ''})
  const { getTokenSilently, user } = useAuth0();
  const [show, setShow] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  const handleClose = () => {
    props.triggerListRefresh()
    setShow(false);
  }
  const handleShow = () => setShow(true);

  useEffect(() => {
      if (uploadStatus.uploadedFilename !== '') {
        handleShow()
      }
  }, [uploadStatus]);

  function handleUpload(event) {
    var formData = new FormData();
    var oaFile = event.target.files[0];
    formData.append('file', oaFile);
    formData.append('userEmail', user.email);
    setShowLoading(true)

    AuthApi('/api/upload', getTokenSilently, formData)
    .then(res => {
        setShowLoading(false)
        setUploadStatus({uploadedFilename: res.filename})
    })

  }

  return (
    <Jumbotron>
        <h3>Upload an Office Action PDF</h3>
        <div style={{display: 'flex', justifyContent: 'center'}}>
        <Form>
            <Form.Group controlId="formGroupFile">
            <Form.Control disabled={!Object.keys(props.pbUser).length>0 || (!props.pbUser.paymentAdded && props.pbUser.oaCredits <= 0)}
                type="file"
                onChange={handleUpload}
                accept=".pdf"
            />
            </Form.Group>
        </Form>
        { showLoading ? <Spinner animation="border" /> : null}
        </div>
        <Modal show={show} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>Uploaded Office Action</Modal.Title>
        </Modal.Header>
        <Modal.Body>We will email you when processing completes.</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleClose}>
            Done
          </Button>
        </Modal.Footer>
      </Modal>

    </Jumbotron>
  )



}

export default UploadView;
