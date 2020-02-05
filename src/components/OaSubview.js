import React, { Component, Fragment } from 'react';
import { withRouter } from 'react-router-dom';
import PriorArtSubview from './PriorArtSubview.js';
// import FigureView from './FigureView.js';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import OaMetadata from './OaMetadata';
import ClaimArgumentSublist from './ClaimArgumentSublist';
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
      <div>
        <Fragment>
          <Container fluid='true'>
            <Row>
              <Col className='bookmark' sm="2" lg="1">
                <OaMetadata uiData={this.state.uiData} />
              </Col>
              <Col sm="7" lg='8'>
                <ClaimArgumentSublist uiData={this.state.uiData} />
              </Col>
              <Col sm="3" lg='3'>
                <PriorArtSubview uiData={this.state.uiData} />
              </Col>
              {/* <Col>
                <FigureView uiData={this.state.uiData} />
              </Col> */}
            </Row>
          </Container>
        </Fragment>
      </div>
    );
  }
}

export default withRouter(OaSubview);
