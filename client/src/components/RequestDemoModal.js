import React, { useState, useEffect } from 'react';
import Modal from 'react-bootstrap/Modal'
import Form from 'react-bootstrap/Form'
import Button from 'react-bootstrap/Button'
import Alert from 'react-bootstrap/Alert'
import { useLocation } from 'react-router-dom';
function RequestDemoModal (props) {
    const [email, setEmail] = useState('');
    const [showAlert, setShowAlert] = useState();
    const [validated, setValidated] = useState(false);
    const location = useLocation();  

    useEffect(() => {
        if (props.user) {
            setEmail(props.user.email)
        }

    }, [props.user])
    const handleSubmit = event => {
        const form = event.currentTarget;
        if (form.checkValidity() === false) {
          event.preventDefault();
          event.stopPropagation();
        }
    
        setValidated(true);
        sendFeedback()
        setTimeout(props.onHide, 2000)
        event.preventDefault();
        event.stopPropagation();

      };
    
    const handleChange = (e) => {
        switch (e.target.name) {
            case 'email':
                setEmail(e.target.value)
                break;
            default: 
                console.log('none')
        }
    }
    const sendFeedback = () => {
        var formData = new FormData();
        formData.append('email', email);
        formData.append('comment', 'demo requested');
        formData.append('path', location.pathname);

        fetch('/api/email', {
            method: 'POST',
            body: formData
          }).then( res => {
            return res.json()
          }).then(r => {
            setShowAlert(true)
          })

    }
    return (
      <Modal
        {...props}
        size="lg"
        aria-labelledby="contained-modal-title-vcenter"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title id="contained-modal-title-vcenter">
          Schedule a Demo
          </Modal.Title>
        </Modal.Header>
        <Form onSubmit={handleSubmit} validated={validated} style={{padding: '1rem'}}>
        <Modal.Body>
        {showAlert && <Alert variant='success'>
            Thank you for your interest.  We will reach out soon!
        </Alert>}
            <Form.Row>
            <Form.Label>Email</Form.Label>
                <Form.Control style={{width: '100%'}} type="email" name='email' placeholder="name@email.com" required value={email} onChange={handleChange} />
            </Form.Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={props.onHide}>Close</Button>
          <Button type='submit'>Send</Button>
        </Modal.Footer>
        </Form>
      </Modal>
    );
  }
  
export default RequestDemoModal