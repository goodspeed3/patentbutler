import React from 'react';
import './HeaderView.css'
import { HashLink as Link } from 'react-router-hash-link';
import { useLocation } from 'react-router-dom';
import logo from '../img/logo.svg'

// import moment from 'moment-timezone'
import Navbar from 'react-bootstrap/Navbar';
import { useAuth0 } from "../react-auth0-spa";
import Button from 'react-bootstrap/Button'

function HeaderView () {
    const location = useLocation();  
    const { isAuthenticated, loginWithRedirect, logout, loading } = useAuth0();

    var component = <div />;
    var landingLinks = (location.pathname === '/' || location.pathname === '/pricing') &&
        <><Link to='/#features'><Button size='sm' variant='link' >Features</Button></Link>      
        <Link to='/pricing'><Button size='sm' variant='link' >Pricing</Button></Link></>

   if (!loading && isAuthenticated) {
      component = (<div className='accountDiv'>
        {landingLinks}
        <Link to='/settings'><Button size='sm' variant='link' >Settings</Button></Link>
        <Button size='sm' variant='info' onClick={() => logout()}>Log out</Button>        
        </div>
      ) 
    } else if (!loading && !isAuthenticated) {
      component = <div className='accountDiv'>{landingLinks}<Button size='sm' variant='info' onClick={() => loginWithRedirect({})}>Log in</Button></div>
    }


    return (
        <Navbar className="headerBar" bg="light" variant="light">
          <Navbar.Brand fixed="top">
            <Link to={isAuthenticated ? "/home" : "/"}>
              <img
                src={logo}
                width="160"
                className="d-inline-block align-top"
                alt="logo"
              />
            </Link>
            {component}
          </Navbar.Brand>
        </Navbar>
    )
}

export default HeaderView;
