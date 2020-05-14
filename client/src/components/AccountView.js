import React, { useState, useEffect } from 'react';
import './AccountView.css'
// import { Link } from 'react-router-dom';
// import moment from 'moment-timezone'
import AuthApi from './AuthApi'
import { useAuth0 } from "../react-auth0-spa";
import Table from 'react-bootstrap/Table'
import Spinner from 'react-bootstrap/Spinner'
import {useStripe, useElements, CardElement} from '@stripe/react-stripe-js';
import CardSection from './CardSection';
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'

function AccountView () {
    const { getTokenSilently, user } = useAuth0();
    const [pbUser, setPbUser] = useState({})
    const stripe = useStripe();
    const elements = useElements();
    const [showLoading, setShowLoading] = useState(false);
    const [cardRowShow, setCardRowShow] = React.useState(false);

    useEffect(() => {
        if (!user)
            return
        //update user state
        var formData = new FormData();
        formData.append('userEmail', user.email);

        AuthApi('/api/user', getTokenSilently, formData, true)
        .then(res => {
            setPbUser(res.user)
        })
    }, [user])


    const handleSubmit = async (event) => {
        setShowLoading(true)
        if (!stripe || !elements) {
          // Stripe.js has not yet loaded.
          // Make sure to disable form submission until Stripe.js has loaded.
          return;
        }
        const actionToTake = event.target.name;
        if (actionToTake === 'removeCard') {
            var formData = new FormData();
            formData.append('email', user.email);
            formData.append('action', actionToTake);

            AuthApi('/api/handleCustomer', getTokenSilently, formData, true)
            .then(res => {
                setShowLoading(false)
                setPbUser(res.user)
            })

            return
        }
        const result = await stripe.createPaymentMethod({
            type: 'card',
            card: elements.getElement(CardElement),
            billing_details: {
              email: user.email,
            },
          });
      
          stripePaymentMethodHandler(result, actionToTake);      
      };
    const stripePaymentMethodHandler = async (result, action) => {
        if (result.error) {
            // Show error in payment form
            console.log(result.error)
        } else {
            // Otherwise send paymentMethod.id to your server
            var formData = new FormData();
            formData.append('email', user.email);
            formData.append('payment_method', result.paymentMethod.id);
            formData.append('last4', result.paymentMethod.card.last4);
            formData.append('action', action);

            AuthApi('/api/handleCustomer', getTokenSilently, formData, true)
            .then(res => {
                handlePaymentResponse(res)
            })
        }
    
    }
    const handlePaymentResponse = (res) => {
        const { latest_invoice } = res.subscription;
        const { payment_intent } = latest_invoice;
        if (payment_intent) {
            const { client_secret, status } = payment_intent;
          
            if (status === 'requires_action') {
              stripe.confirmCardPayment(client_secret).then(function(result) {
                if (result.error) {
                    // console.log(result.error)
                    alert(result.error);
                  // Display error message in your UI.
                  // The card was declined (i.e. insufficient funds, card has expired, etc)
                } else {
                    // console.log(latest_invoice)
                  // Show a success message to your customer
                }
              });
            } else {
                // console.log(latest_invoice)
                // No additional information was needed
              // Show a success message to your customer
            }
        } else {
            // console.log(latest_invoice)
        }
        setPbUser(res.user)
        setShowLoading(false)

    }

    if (!user || Object.keys(pbUser).length === 0) {
        return <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div>
    }

    var paymentElements;
    if (pbUser.perUserPlan) {
        paymentElements = <div>Legal Enterprise Plan</div>
    } else if (!pbUser.customerId) {
        paymentElements = <Container>
        <Row>
            <CardSection />
        </Row>
        <Row>
            <Button style={{marginTop: '1rem'}} name='addCard' onClick={handleSubmit} disabled={!stripe || showLoading}>
                Add Card
            </Button> 
        </Row>
        </Container>
    } else {
        paymentElements = <Container>
        <Row>* - {pbUser.last4}</Row>
        {cardRowShow && <Row><CardSection style={{marginTop: '1.2em'}}/></Row>}
        <Row><Button style={{marginTop: '1rem'}} size='sm' name='updateCard' onClick={(e) => {cardRowShow ? handleSubmit(e) : setCardRowShow(true)}} disabled={!stripe || showLoading}>
            Update Card
        </Button> 
        <Button style={{marginTop: '1rem', marginLeft: '0.5rem'}} name='removeCard' size='sm' onClick={handleSubmit} disabled={!stripe || showLoading}>
            Remove Payment Information
        </Button></Row>
    </Container>
    }

    return (
    <div className='account'>
        <h1 className='header'>Account</h1>
        <Table responsive className='accountTable'>
        <tbody>
            <tr>
            <td width="40%">Email</td>
            <td colSpan='2'>{user.email}</td>
            </tr>
            { pbUser.oaCredits > 0 && 
            <tr>
            <td>Office Action Credits</td>
            <td colSpan='2'>{pbUser.oaCredits}</td>
            </tr>
            }
            <tr>
            <td>Office Actions Processed<br /><small className='text-muted'>Data automatically deleted 6 months after upload</small></td>
            <td colSpan='2'>{pbUser.numOaProcessed}</td>
            </tr>
            <tr>
            <td>Payment<br /><small className='text-muted'>Stored by Stripe and billed monthly</small></td>
            <td>{paymentElements} </td>
            <td>{ showLoading ? <Spinner animation="border" /> : null}</td>
            </tr>
        </tbody>
        </Table>
    </div>
    )
}

export default AccountView;
