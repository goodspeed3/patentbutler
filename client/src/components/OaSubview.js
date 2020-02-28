import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import PriorArtSubview from './PriorArtSubview.js';
// import FigureView from './FigureView.js';
// import Col from 'react-bootstrap/Col';
// import Container from 'react-bootstrap/Container';
// import Row from 'react-bootstrap/Row';
import OaMetadata from './OaMetadata';
import ClaimArgumentList from './ClaimArgumentList';
//Use OaOverview css
import './OaOverview.css' 

class OaSubview extends Component {
  constructor(props) {
    super(props);
    this.state = {
      uiData: this.props.uiData,
      publicationNumber: this.props.match.params.publicationNumber,
      citation: this.props.match.params.citation
    };

    // console.log(this.state);
  }

  render() {

    return (
      <div className='row'>
        <div className='bookmark leftColSubview'>
          <OaMetadata uiData={this.state.uiData} />
        </div>
        <div className='middleColSubview'>
          <ClaimArgumentList uiData={this.state.uiData} />
        </div>
        <div className='rightColSubview'>
          <PriorArtSubview uiData={this.state.uiData} />
        </div>
      </div>
    );
  }
}

export default withRouter(OaSubview);
