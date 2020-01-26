import React, { Component } from 'react';
import { withRouter } from 'react-router-dom';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Tooltip from 'react-bootstrap/Tooltip';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';
import Button from 'react-bootstrap/Button';

class PriorArtSubview extends Component {
  constructor(props) {
    super(props);

    var priorArt = this.getPriorArt(this.props.uiData);
    this.state = {
      uiData: this.props.uiData,
      publicationNumber: this.props.match.params.publicationNumber,
      citation: this.props.match.params.citation,
      priorArt: priorArt,
      selectedParagraphs: this.getSelectedPara(
        priorArt,
        this.props.match.params.citation
      )
    };
  }
  getPriorArt(uiData) {
    var priorArt;
    for (var i = 0; i < this.props.uiData.rejectionList.length; i++) {
      var rejectionObj = this.props.uiData.rejectionList[i];
      if (rejectionObj.priorArtList) {
        for (var j = 0; j < rejectionObj.priorArtList.length; j++) {
          var candidatePriorArt = rejectionObj.priorArtList[j];
          if (
            candidatePriorArt.publicationNumber ===
            this.props.match.params.publicationNumber
          ) {
            priorArt = candidatePriorArt;
            return priorArt;
          }
        }
      }
    }
    return null;
  }
  getSelectedPara(priorArt, citation) {
    var range = 1; //number of surrounding paragraphs to show
    var index = 0;
    var start = 0;
    var end = 0;
    for (var i = 0; i < priorArt.paragraphList.length; i++) {
      var paragraphObj = priorArt.paragraphList[i];
      if (paragraphObj.citation === citation) {
        index = i;
      }
    }
    if (index <= range) {
      start = 0;
    } else {
      start = index - range;
    }
    if (index + range >= priorArt.paragraphList.length - 1) {
      end = priorArt.paragraphList.length - 1;
    } else {
      end = index + range;
    }
    var selectedPara = [];
    for (var j = start; j <= end; j++) {
      selectedPara.push(priorArt.paragraphList[j]);
    }

    return selectedPara;
  }
  render() {
    return (
      <Container>
        <Row>
          <Col>
            <h3>{this.state.priorArt.abbreviation}</h3>
          </Col>
          <Col>
            <OverlayTrigger
              trigger="click"
              placement="bottom"
              overlay={
                <Tooltip id={`tooltip-bottom`}>
                  {this.state.priorArt.abstract}
                </Tooltip>
              }
            >
              <Button variant="primary">Abstract</Button>
            </OverlayTrigger>
          </Col>
        </Row>
        <Row>
          <Col>
            <b>Pub #</b>
          </Col>
          <Col md="auto">{this.state.priorArt.publicationNumber}</Col>
        </Row>
        <Row>
          <Col>
            <b>Title</b>
          </Col>
          <Col md="auto">{this.state.priorArt.title}</Col>
        </Row>
        <Row>
          <Col>
            <b>Assignee</b>
          </Col>
          <Col md="auto">{this.state.priorArt.assignee}</Col>
        </Row>
        {this.showPriorArt(this.state.selectedParagraphs)}
      </Container>
    );
  }

  showPriorArt = paragraphsToShow => {
    return paragraphsToShow.map(paParagraph => (
      <Row key={'p' + paParagraph.citation}>
        <Col>
          <h4>{paParagraph.citation}</h4>
        </Col>
        <Col md="auto">
          <p>{paParagraph.text}</p>
        </Col>
      </Row>
    ));
  };
}

export default withRouter(PriorArtSubview);
