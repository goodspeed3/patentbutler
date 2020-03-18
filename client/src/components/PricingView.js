import React, {useState} from 'react';
import './PricingView.css'
// import { Link } from 'react-router-dom';
// import moment from 'moment-timezone'
import ButtonGroup from 'react-bootstrap/ButtonGroup'
import Button from 'react-bootstrap/Button'

function PricingView () {
    const [savingsPressed, setSavingsPressed] = useState(false)

    const toggleSavings = () => setSavingsPressed(!savingsPressed)

    return (
    <div className='pricing'>
        <div className='header'>Simple, transparent pricing.</div>
        <div className="toggle"><ButtonGroup><Button onClick={toggleSavings} variant={savingsPressed ? 'outline-primary' : 'primary'}>Pricing</Button><Button onClick={toggleSavings} variant={savingsPressed ? 'primary' : 'outline-primary'}>Include Potential Savings<sup>*</sup></Button></ButtonGroup></div>
        <div className="boxes"><div className="box">Legal Pro</div><div className="box">Legal Enterprise</div></div>
        <div className='disclaimer'><sup>*</sup>Savings assume 2 hours saved per OA with a $400 billable hour rate</div>
    </div>
    )
}

export default PricingView;
