import React, { Component } from 'react';
import ClaimArgumentList from './ClaimArgumentList';
import PriorArtOverview from './PriorArtOverview.js';
import PriorArtSubview from './PriorArtSubview.js';
// import Col from 'react-bootstrap/Col';
// import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';
import PrivateRoute from "./PrivateRoute";
import { Auth0Context } from "../react-auth0-spa";
import AuthApi from './AuthApi'

import OaMetadata from './OaMetadata';
import './OaOverview.css'
import {   
  Switch,
  // Route,
  withRouter
} from 'react-router-dom';
import SplitPane from 'react-split-pane';
import Spinner from 'react-bootstrap/Spinner'

class OaOverview extends Component {
  static contextType = Auth0Context;

  constructor(props) {
    super(props);

    this.state = {
      // uiData: this.props.uiData,
      uiData: {},
      filename: this.props.match.params.filename,
      path: '/view',
      panePosition: '70%',
    };
  }
  componentDidMount() {
    const filename = this.props.match.params.filename;
    var formData = new FormData();
    formData.append('filename', filename);

    AuthApi('/api/getProcessedOa', this.context.getTokenSilently, formData)
    .then(res => {
      this.setState({
        uiData: res.processedOa
      })
      
    })  

  }

  handlePane = (val) => {
    // localStorage.setItem('splitPos', size)

    this.setState({
      panePosition: val
    })
  }

  render() {
    if (Object.keys(this.state.uiData).length === 0) {
      return <Spinner animation="border" />
    }
    console.log(this.state.uiData)
    return (
      <div className='row'>
          <div className='bookmark leftCol'>
            <OaMetadata uiData={this.state.uiData} />
          </div>
          <div className='middleAndRightCol'>
            <SplitPane 
              split="vertical" 
              defaultSize={this.state.panePosition} 
              // onDragFinished = {size => this.handlePane(size)}
              onChange={size => this.handlePane(size)} 
              maxSize={-200} 
              minSize={500}
            >
              <div className='middleCol'>
                <ClaimArgumentList uiData={this.state.uiData} />
              </div>
              <div className='rightCol'>
                <Switch>
                  <PrivateRoute exact path={this.state.path}>
                      <PriorArtOverview uiData={this.state.uiData} />
                  </PrivateRoute>
                  <PrivateRoute path={`${this.state.path}/:filename/:publicationNumber/:citation`}>
                      <PriorArtSubview uiData={this.state.uiData} handler={this.handlePane} panePosition={this.state.panePosition}/>
                  </PrivateRoute>
                </Switch>
              </div> 
            </SplitPane>
          </div>
      </div>
    );
  }



}

export default withRouter(OaOverview);
