import React, {useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Switch, Link, Redirect } from 'react-router-dom';
import Navbar from 'react-bootstrap/Navbar';
import logo from './img/logo.svg'
import LoginView from './components/login.js'
import HomeView from './components/home.js'
import './App.css';
import Button from 'react-bootstrap/Button'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    console.log(isAuthenticated)
  }, [isAuthenticated]);

  var component = <div />;
  if (isAuthenticated) {
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
          <Route exact path="/" render={() => <LoginView setIsAuthenticated={setIsAuthenticated} /> } />
          <Route path="/home" render={() => isAuthenticated ? <HomeView /> : <Redirect to='/' />} />

        </Switch>
      </Router>  );
}

export default App;
