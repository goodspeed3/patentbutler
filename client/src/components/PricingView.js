import React, {useState} from 'react';
import './PricingView.css'
// import { Link } from 'react-router-dom';
import { useAuth0 } from "../react-auth0-spa";
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import CardDeck from 'react-bootstrap/CardDeck'
import FeedbackModal from './FeedbackModal'
import ReactGA from 'react-ga'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'


function PricingView () {
    const [savingsPressed, setSavingsPressed] = useState(false)
    const { loginWithRedirect } = useAuth0();
    const [modalShow, setModalShow] = React.useState(false);

    const toggleSavings = () => {
        setSavingsPressed(!savingsPressed)
        ReactGA.event({
            category: 'User',
            action: 'Pressed Include Potential Savings'
          });
    }
    let hourlyRate = 400
    let numHoursSaved = 1.5
    let moneySavedIndividual = numHoursSaved * hourlyRate
    let monthlyOa = 4
    let moneySavedFirm = numHoursSaved * hourlyRate * monthlyOa
    return (
    <div className='pricing'>
        <div className='header'>Plans That Pay For Themselves</div>
        <div className="toggle"><ButtonGroup><Button onClick={toggleSavings} variant={savingsPressed ? 'outline-primary' : 'primary'}>Pricing</Button><Button onClick={toggleSavings} variant={savingsPressed ? 'primary' : 'outline-primary'}>Include Potential Savings<sup>*</sup></Button></ButtonGroup></div>
        <CardDeck className='cd'>
            <Card style={{ width: '22rem' }}>
                <Card.Body>
                <Card.Title>Legal Professional</Card.Title>
                <Card.Title className='pricingText'>
                    <p>{!savingsPressed ? '$199' : <span style={{color: '#22BC66'}}>${moneySavedIndividual - 199}</span>}<span className='unit'>{savingsPressed && <span style={{color: '#22BC66'}}> saved </span>}/ Office Action</span></p>
                </Card.Title>
                <Container className='benefits'>
                <Row className='benefitsRow' >
                <Col md='2'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                </Col><Col >
                1st Office Action processed for free</Col>
                </Row>
                <Row className='benefitsRow'>
                <Col md='2'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                </Col><Col>
                Convert Office Action into optimal reading form</Col>
                </Row>
                <Row className='benefitsRow'>
                <Col md='2'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span></Col><Col>
                Unlimited § 102 and § 103 citation mappings</Col>
                </Row>
                <Row className='benefitsRow'>
                <Col md='2'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span></Col><Col>
                Unlimited Prior Art processing</Col>
                </Row>
                <Row className='benefitsRow'>
                <Col md='2'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span></Col><Col>
                2-day turnaround time</Col>
                </Row>
                </Container>                           
                </Card.Body>
                <Card.Footer>
                <Button onClick={loginWithRedirect}>Sign up</Button>
                <br /><small>No credit card required</small>
                </Card.Footer>
            </Card>
            
            <Card style={{ width: '22rem' }}>
            <Card.Body>
                <Card.Title>Legal Enterprise</Card.Title>
                <Card.Title className='pricingText'>
                    <p>{!savingsPressed ? '$399' : <span style={{color: '#22BC66'}}>${moneySavedFirm - 399}</span>}<span className='unit'>{savingsPressed && <span style={{color: '#22BC66'}}> saved </span>} / user / month</span></p>
                </Card.Title>
                <Container className='benefits'>
                <Row className='benefitsRow' >
                <Col md='2'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                </Col><Col >
                Unlimited Office Action processing</Col>
                </Row>
                <Row className='benefitsRow'>
                <Col md='2'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                </Col><Col>
                Convert Office Action into optimal reading form</Col>
                </Row>
                <Row className='benefitsRow'>
                <Col md='2'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span></Col><Col>
                Unlimited § 102 and § 103 citation mappings</Col>
                </Row>
                <Row className='benefitsRow'>
                <Col md='2'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span></Col><Col>
                Unlimited Prior Art processing</Col>
                </Row>
                <Row className='benefitsRow'>
                <Col md='2'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span></Col><Col>
                2-day turnaround time</Col>
                </Row>
                </Container>                         
                </Card.Body>
                <Card.Footer>
                <Button onClick={() => setModalShow(true)}>Contact Us</Button><br /><small>Reach out with any questions</small>
                </Card.Footer>
            </Card>
        </CardDeck>
        <small className='text-muted'><sup>*</sup>Savings assume {numHoursSaved} hours saved per OA with an average ${hourlyRate} billable hour rate and {monthlyOa} OAs / mo</small>
        <FeedbackModal
                show={modalShow}
                onHide={() => setModalShow(false)}
            />


    </div>
    )
}

export default PricingView;
