import React, {useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, Redirect } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import logo from './img/logo.svg'
import LoginView from './components/login.js'
import HomeView from './components/home.js'
import './App.css';
import Button from 'react-bootstrap/Button'
import PrivateRoute from "./components/PrivateRoute";
import { useAuth0 } from "./react-auth0-spa";

function App() {
  const { isAuthenticated, loading, loginWithRedirect, logout } = useAuth0();

  useEffect(() => {
    console.log(isAuthenticated)
  }, [isAuthenticated]);

  var component = <div />;
  if (isAuthenticated && !loading) {
    component = (<div className='accountDiv'>
      <Button size='sm' variant='info'>Log out</Button>        
      </div>
    ) 
  }

  return (
      <Router>
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
        </Navbar>
        <Switch>
          <Route exact path="/" component={LoginView} />
          <PrivateRoute path="/home" component={HomeView}  />

        </Switch>
      </Router>  );
}

export default App;
