import React from 'react';
import './LandingView.css'
// import { Link } from 'react-router-dom';
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Row from 'react-bootstrap/Row'
import Col from 'react-bootstrap/Col'
import { useAuth0 } from "../react-auth0-spa";
import FooterView from './FooterView';
import ReactGA from 'react-ga'
import RequestDemoModal from './RequestDemoModal'

function LandingView () {
    const { loginWithRedirect } = useAuth0();
    const [modalShow, setModalShow] = React.useState(false);

    React.useEffect(() => {
        window.scrollTo(0, 0)
      }, [])
      
    return (
    <div className='landing'>
        <div className='block1'>
            <div>
                <h1 className='tagline'>The Fastest Way to Prosecute Patents</h1>
                <h4 className='subTagline'>Upload an Office Action (.pdf), get a new experience.</h4>
                <div className='cta'><Button onClick={() => {         
                    ReactGA.event({
                        category: 'User',
                        action: 'Pressed Top Signup for Free'
                    });
                    loginWithRedirect()}}>Sign Up for Free</Button><Button style={{marginLeft: '1rem'}} variant='outline-secondary' onClick={() => { ReactGA.modalview('/request-demo');
                setModalShow(true)} }>Request a demo</Button></div>
            </div>
            <video className='landingImg' width='80%' controls={true} autoPlay={false} muted={true} loop={true} src='https://storage.googleapis.com/crafty-valve-269403.appspot.com/static/demo.mp4' poster={process.env.PUBLIC_URL + '/landingA.png'}>
                <img className='landingImg' width='1200' alt='landingA' src={process.env.PUBLIC_URL + '/landingA.png'} />

            </video>
        </div>    
        <div className='block2' id="features">
            <div >
                <h1 className='secondTagline'>See USPTO Examiner remarks side-by-side with cited art</h1>
                <h4 className='subTagline'>Read everything in one place</h4>
            </div>
            <Container className='checkMarkDivs'>
                <Row className='checkMarkRow'>
                    <Col md="1"><svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg></Col>
                    <Col><b>Spend fewer hours searching</b><br />PatentButler automatically gathers all relevant § 102 and § 103 art and highlights key focus areas.</Col>
                </Row>
                <Row className='checkMarkRow'>
                    <Col md="1"><svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg></Col>
                    <Col><b>Be a more efficient patent practitioner</b><br />PatentButler immediately identifies what the examiner is arguing so you can effectively respond.</Col>
                </Row>
                <Row className='checkMarkRow'>
                    <Col md="1"><svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg></Col>
                    <Col><b>Craft better arguments</b><br />PatentButler helps you understand applications more wholistically because all the case information is at your fingertips.</Col>

                </Row>
                <Row className='checkMarkRow'>
                    <Col md="1"><svg className="checkmark" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52"><circle className="checkmark__circle" cx="26" cy="26" r="25" fill="none"/><path className="checkmark__check" fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8"/></svg></Col>
                    <Col><b>Improve team-wide efficiency</b><br />Both handling and supervising team members can work off of the same processed office action, thereby doubling or tripling savings.</Col>

                </Row>

            </Container>
            
            <img className='landingImg' width='1150' alt='landingB' src={process.env.PUBLIC_URL + '/landingB.png'} />
        </div>
        <div className='block1'>

        <div>
            <h1 className='secondTagline'>You're in great company</h1>
                <h4 className='subTagline'>See what people say about us</h4>
            </div>
            <div style={{marginTop: '3rem'}}>
                <div className='testimonial'>I save hours for each office action I handle using PatentButler.  The worst part of responding to actions was always getting all the files in one place and flipping back and forth between the art and the office action.  PatentButler is so much easier to use!<div>- Lawyer at Fish & Richardson, P.C.</div></div>
                <div className='testimonial'>PatentButler makes it easy to come up with Office Action responses because I see everything in one place.  <div>- Agent at Sheppard Mullin, LLP</div></div>
                <div className='testimonial'>Where was PatentButler when I started practicing patent law?  <div>- Lawyer at Baker Botts, LLP</div></div>

            </div>            
        </div>    
        <div className='block2'>
            <div>
                <h1 className='secondTagline'>FAQ</h1>
                <h4 className='subTagline'>How does PatentButler work?</h4>
                <p className='faqText'>Through a combination of machine learning and human optimization, PatentButler takes an office action, gathers relevant art, and highlights actionable areas for a practitioner to focus on.</p>
                <h4 className='subTagline'>How does PatentButler access cited art?</h4>
                <p className='faqText'>Our system automatically grabs publicly available cited art from the Internet.  In the uncommon event the cited art is not publicly available, we may ask you for a copy of the cited art so our systems can map office actions to the cited art.</p>

            </div>

        </div>
        <div className='block1'>
            <div>
                <h1 className='secondTagline'>Ready to get started?</h1>
                <div className='cta'><Button onClick={() => {         
                    ReactGA.event({
                        category: 'User',
                        action: 'Pressed Bottom Signup for Free'
                    });
            loginWithRedirect()}}>Sign Up for Free</Button></div>
            </div>
        </div>    
        <FooterView />
        <RequestDemoModal
                show={modalShow}
                onHide={() => setModalShow(false)}
            />
    </div>
    )
}

export default LandingView;
