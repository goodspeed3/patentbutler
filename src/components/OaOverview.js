import React, { Component } from 'react';
import ClaimArgumentList from './ClaimArgumentList';
import PriorArtOverview from './PriorArtOverview.js';
// import Col from 'react-bootstrap/Col';
// import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';
import OaMetadata from './OaMetadata';
import './OaOverview.css'

class OaOverview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uiData: this.props.uiData
    };
  }

  render() {
    return (
      <div className='row'>
          <div className='bookmark leftColOverview'>
            <OaMetadata uiData={this.state.uiData} />
          </div>
          <div className='middleColOverview'>
            <ClaimArgumentList uiData={this.state.uiData} />
          </div>
          <div className='rightColOverview'>
            <PriorArtOverview uiData={this.state.uiData} />
          </div>
      </div>
    );
  }



}

export default OaOverview;
