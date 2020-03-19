import React from 'react';
import './HeaderView.css'
import { HashLink as Link } from 'react-router-hash-link';
import { useLocation } from 'react-router-dom';
import logo from '../img/logo.svg'

 
// import moment from 'moment-timezone'
import Navbar from 'react-bootstrap/Navbar';
import { useAuth0 } from "../react-auth0-spa";
import Button from 'react-bootstrap/Button'
import FeedbackModal from './FeedbackModal'

function HeaderView () {
    const location = useLocation();  
    const { isAuthenticated, loginWithRedirect, logout, loading, user } = useAuth0();
    const [modalShow, setModalShow] = React.useState(false);

    var component = <div />;
    var publicLinks = ['/', '/pricing', '/about', '/terms', '/privacy']
    var landingLinks = publicLinks.includes(location.pathname) &&
        <><Link to='/#features'><Button size='sm' variant='link' >Features</Button></Link>      
        <Link to='/pricing'><Button size='sm' variant='link' >Pricing</Button></Link></>

   if (!loading && isAuthenticated) {
      component = (<div className='accountDiv'>
        {landingLinks}
        <Button size='sm' variant='link' onClick={() => setModalShow(true)}>Give Feedback</Button>
        <Link to='/home'><Button size='sm' variant='link' >Home</Button></Link>
        <Link to='/account'><Button size='sm' variant='link' >Account</Button></Link>
        <Button size='sm' variant='info' onClick={() => logout()}>Log out</Button>        
        </div>
      ) 
    } else if (!loading && !isAuthenticated) {
      component = <div className='accountDiv'>{landingLinks}<Button size='sm' variant='info' onClick={() => loginWithRedirect({})}>Log in</Button></div>
    }


    return (
        <Navbar className="headerBar" bg="light" variant="light">
          <Navbar.Brand fixed="top">
            <Link to="/">
              <img
                src={logo}
                width="160"
                className="d-inline-block align-top"
                alt="logo"
              />
            </Link>
            {component}
          </Navbar.Brand>
          <FeedbackModal
                show={modalShow}
                onHide={() => setModalShow(false)}
                user={user}
            />

        </Navbar>
    )
}
  
export default HeaderView;
