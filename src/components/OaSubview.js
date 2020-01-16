import React, { Component, Fragment } from 'react';
import { withRouter } from 'react-router-dom';
import PriorArtSubview from './PriorArtSubview.js';
// import FigureView from './FigureView.js';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import OaMetadata from './OaMetadata';
import ClaimArgumentList from './ClaimArgumentList';

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
          <Container>
            <Row>
              <Col>
                <Container>
                  <Row>
                    <OaMetadata uiData={this.state.uiData} />
                  </Row>
                  <Row>
                    <ClaimArgumentList uiData={this.state.uiData} />
                  </Row>
                </Container>
              </Col>
              <Col>
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
