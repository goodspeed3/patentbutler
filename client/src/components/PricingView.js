import React, {useState} from 'react';
import './PricingView.css'
// import { Link } from 'react-router-dom';
import { useAuth0 } from "../react-auth0-spa";
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Button from 'react-bootstrap/Button'
import Card from 'react-bootstrap/Card'
import CardDeck from 'react-bootstrap/CardDeck'
import FeedbackModal from './FeedbackModal'

function PricingView () {
    const [savingsPressed, setSavingsPressed] = useState(false)
    const { loginWithRedirect } = useAuth0();
    const [modalShow, setModalShow] = React.useState(false);

    const toggleSavings = () => setSavingsPressed(!savingsPressed)

    return (
    <div className='pricing'>
        <div className='header'>Simple, transparent pricing.</div>
        <div className="toggle"><ButtonGroup><Button onClick={toggleSavings} variant={savingsPressed ? 'outline-primary' : 'primary'}>Pricing</Button><Button onClick={toggleSavings} variant={savingsPressed ? 'primary' : 'outline-primary'}>Include Potential Savings<sup>*</sup></Button></ButtonGroup></div>
        <CardDeck className='cd'>
            <Card style={{ width: '22rem' }}>
                <Card.Body>
                <Card.Title>Legal Pro</Card.Title>
                <Card.Title className='pricingText'>
                    <p>{!savingsPressed ? '$199' : <span style={{color: '#22BC66'}}>$601</span>}<span className='unit'>{savingsPressed && <span style={{color: '#22BC66'}}> saved </span>}/ office action</span></p>
                </Card.Title>
                <Card.Text className='benefits'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                1st Office Action processed for free
                </Card.Text>
                <Card.Text className='benefits'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                2-day turnaround time
                </Card.Text>                
                <Card.Text className='benefits'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                20 mapped claims per OA
                </Card.Text>           
                <Card.Text className='benefits'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                Unlimited Prior Art processing
                </Card.Text>                           
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
                    <p>Contact Us</p>
                </Card.Title>
                <Card.Text className='benefits'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                1st Office Action processed for free
                </Card.Text>
                <Card.Text className='benefits'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                2-day turnaround time
                </Card.Text>                
                <Card.Text className='benefits'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                20 mapped claims per OA
                </Card.Text>           
                <Card.Text className='benefits'>
                <span className='marks'><svg fill="#22BC66" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z"/></svg></span>
                Unlimited Prior Art processing
                </Card.Text>                           
                </Card.Body>
                <Card.Footer>
                <Button onClick={() => setModalShow(true)}>Contact Us</Button><br /><small>Reach out with any questions</small>
                </Card.Footer>
            </Card>
        </CardDeck>
        <small className='text-muted'><sup>*</sup>Savings assume 2 hours saved per OA with a $400 billable hour rate</small>
        <FeedbackModal
                show={modalShow}
                onHide={() => setModalShow(false)}
            />


    </div>
    )
}

export default PricingView;
