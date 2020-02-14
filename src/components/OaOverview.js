import React, { Component } from 'react';
import ClaimArgumentList from './ClaimArgumentList';
import PriorArtOverview from './PriorArtOverview.js';
import PriorArtSubview from './PriorArtSubview.js';
// import Col from 'react-bootstrap/Col';
// import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';
import OaMetadata from './OaMetadata';
import './OaOverview.css'
import {   
  Switch,
  Route,
  withRouter
 } from 'react-router-dom';

class OaOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uiData: this.props.uiData,
      path: '/view'
    };
  }

  render() {
    console.log(this.state.path)
    return (
      <div className='row'>
          <div className='bookmark leftCol'>
            <OaMetadata uiData={this.state.uiData} />
          </div>
          <div className='middleCol'>
            <ClaimArgumentList uiData={this.state.uiData} />
          </div>
          <div className='rightCol'>
            <Switch>
              <Route exact path={this.state.path}>
                  <PriorArtOverview uiData={this.state.uiData} />
              </Route>
              <Route path={`${this.state.path}/:publicationNumber/:citation`}>
                  <PriorArtSubview uiData={this.state.uiData} />
              </Route>
            </Switch>
          </div>

      </div>
    );
  }



}

export default withRouter(OaOverview);
