import React, { Component } from 'react';
import ClaimArgumentList from './ClaimArgumentList';
import PriorArtOverview from './PriorArtOverview.js';
import PriorArtSubview from './PriorArtSubview.js';
// import Col from 'react-bootstrap/Col';
// import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';
// import PrivateRoute from "./PrivateRoute";
import FigureView from "./FigureView.js";
import { Auth0Context } from "../react-auth0-spa";
import AuthApi from './AuthApi'
// import Alert from 'react-bootstrap/Alert'

import OaMetadata from './OaMetadata';
import './OaOverview.css'
import {   
  Switch,
  Route,
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
      panePosition: '70%',
      showFigs: false,
      paForFigs: {}
    };

  }
  componentDidMount() {
    var formData = new FormData();
    var filename = this.props.match.params.filename
    if (!filename.endsWith('.pdf')) {
      filename = filename + '.pdf'
    }
    if (this.props.demo) {
      formData.append('filename', filename);
      fetch('/api/demo', {
        method: 'POST',
        body: formData
      }).then( res => {
        return res.json()
      }).then(r => {
        this.setState({
          uiData: r.processedOa
        })
      })

    } else {
      formData.append('filename', filename);
  
      AuthApi('/api/getProcessedOa', this.context.getTokenSilently, formData)
      .then(res => {
        // console.log(res.processedOa)
        this.setState({
          uiData: res.processedOa
        })
        
      })  
  
    }

  }


  handlePane = (val) => {
    // localStorage.setItem('splitPos', size)
    // console.log('handling: ' + val)
    this.setState({
      panePosition: val
    })
  }

  handleFigs = (shouldShowFigs, pa = {}) => {
    // localStorage.setItem('splitPos', size)
    // console.log(pa)
    this.setState({
      showFigs: shouldShowFigs,
      paForFigs: pa
    })
  }
  

  render() {
    if (Object.keys(this.state.uiData).length === 0) {
      return <div style={{display: "flex", justifyContent: "center", marginTop: "1rem"}}><Spinner animation="border" /></div>
    }
    // console.log(this.state.uiData)
    return (
      <div className='row'>
          <div className='bookmark leftCol'>
          <OaMetadata demo={this.props.demo} uiData={this.state.uiData} /> 
            
          </div>
          <div className='middleAndRightCol'>
          {/* {true && <Alert className='mb-0' variant='warning' style={{position: 'sticky', top: '0', zIndex: 10}}>Demo - <Alert.Link onClick={() => this.context.loginWithRedirect()}>Sign up for free.</Alert.Link></Alert>} */}
            <SplitPane 
              split="vertical" 
              defaultSize={this.state.panePosition} 
              onDragFinished = {size => this.handlePane(size)}
              // onChange={size => this.handlePane(size)} 
              maxSize={-200} 
              minSize={500}
            >
              <div className='middleCol'>
              {this.state.showFigs ? 
              <FigureView uiData={this.state.uiData} handleFigs={this.handleFigs} paForFigs={this.state.paForFigs} panePosition={this.state.panePosition}/>
              : 
              <ClaimArgumentList demo={this.props.demo} uiData={this.state.uiData} />
              }                
              </div>
              <div className='rightCol'>
                <Switch>
                  <Route exact path={'/demo/:filename'}>
                      <PriorArtOverview demo={true} uiData={this.state.uiData} />
                  </Route>
                  <Route exact path={'/demo/:filename/:abbreviation/:citation'}>
                    <PriorArtSubview demo={true} uiData={this.state.uiData} handler={this.handlePane} panePosition={this.state.panePosition} handleFigs={this.handleFigs}/>
                  </Route>
                  <Route exact path={'/view/:filename'}>
                      <PriorArtOverview uiData={this.state.uiData} />
                  </Route>
                  <Route path={'/view/:filename/:abbreviation/:citation'}>
                      <PriorArtSubview uiData={this.state.uiData} handler={this.handlePane} panePosition={this.state.panePosition}  handleFigs={this.handleFigs}/>
                  </Route>
                </Switch>
              </div> 
            </SplitPane>
          </div>


      </div>
    );
  }



}

export default withRouter(OaOverview);
