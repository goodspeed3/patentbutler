import React, { Component, Fragment } from 'react';
import ClaimArgumentList from './ClaimArgumentList';
import PriorArtOverview from './PriorArtOverview.js';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
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
      <div>
        <Fragment>
          <Container fluid='true'>
            <Row>
              <Col className='bookmark' sm="2" lg="1">
                <OaMetadata uiData={this.state.uiData} />
              </Col>
              <Col sm="7" lg='8'>
                <ClaimArgumentList uiData={this.state.uiData} />
              </Col>
              <Col sm="3" lg='3'>
                <PriorArtOverview uiData={this.state.uiData} />
              </Col>
            </Row>
          </Container>
        </Fragment>
      </div>
    );
  }
}

export default OaOverview;
