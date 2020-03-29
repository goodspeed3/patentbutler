import React from 'react';
import { BrowserRouter as Router, Switch, Link } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import logo from './img/logo.svg'
import HomeView from './components/home.js'
import ProcessView from './components/process.js'
import './App.css';
import Button from 'react-bootstrap/Button'
import PrivateRoute from "./components/PrivateRoute";
import { useAuth0 } from "./react-auth0-spa";

function App() {
  const { isAuthenticated, loading, loginWithRedirect, logout, user } = useAuth0();

  var component = <div />;
  if (isAuthenticated && !loading) {
    component = (<div className='accountDiv'>
      <Button size='sm' variant='danger' onClick={() => logout({
      returnTo: window.location.origin })}>Log out {user.email}</Button>        
      </div>
    ) 
  } else if (!isAuthenticated && !loading) {
    component = (<div className='accountDiv'>
        <Button size='sm' variant='danger' onClick={() => loginWithRedirect({})}>Log in</Button>        
      </div>
    ) 
  }

  return (
      <Router>
        <Navbar className="headerBar" bg="light" variant="light">
          <Navbar.Brand fixed="top">
            <Link to="/admin">
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
          <PrivateRoute exact path="/admin" component={HomeView} />
          <PrivateRoute path="/admin/process/:filename" component={ProcessView} />

        </Switch>
      </Router>  );
}

export default App;
