import React, { Component, Fragment } from 'react';
import ClaimArgumentList from './ClaimArgumentList';
import PriorArtOverview from './PriorArtOverview.js';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import OaMetadata from './OaMetadata';

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
          <Container>
            <Row>
              <Col xs="8">
                <Container>
                  <Row>
                    <OaMetadata uiData={this.state.uiData} />
                  </Row>
                  <Row>
                    <ClaimArgumentList uiData={this.state.uiData} />
                  </Row>
                </Container>
              </Col>
              <Col xs="4">
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
